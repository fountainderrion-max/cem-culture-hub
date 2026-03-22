#property strict
#property copyright "DF QUANTUM"
#property version   "1.00"

input int    InpMagicNumber            = 890001;
input bool   InpAllowBuy               = true;
input bool   InpAllowSell              = true;
input double InpBaseLots               = 0.01;
input double InpRiskPerTradePercent    = 1.0;
input bool   InpUseRiskSizing          = true;
input int    InpMaxSpreadPoints        = 80;
input int    InpSlippage               = 5;
input int    InpBaseStopLossPoints     = 900;
input int    InpBaseTakeProfitPoints   = 1400;
input int    InpBaseTrailingStopPoints = 700;
input int    InpFastMAPeriod           = 20;
input int    InpSlowMAPeriod           = 55;
input int    InpRSIPeriod              = 14;
input int    InpATRPeriod              = 14;
input double InpVoteThreshold          = 0.58;
input int    InpMinBarsBetweenTrades   = 6;
input int    InpInstitutionStepPoints  = 1000;
input bool   InpUseInstitutionLogic    = true;
input string InpBotManifestFile        = "df-quantum-bot-manifest.csv";
input bool   InpUsePersistentMemory    = true;
input string InpMemoryFile             = "df-quantum-memory.csv";

datetime g_lastTradeBarTime = 0;
datetime g_lastClosedScanTime = 0;
double   g_recentWinRate = 0.50;
double   g_recentAvgR = 0.0;
double   g_recentProfitFactor = 1.0;
int      g_recentTrades = 0;
int      g_behaviorMode = 1; // 0 conservative, 1 balanced, 2 aggressive

string g_botNames[];
double g_botWeights[];
int    g_botEnabled[];
int    g_botCount = 0;

string ToLowerSafe(string s)
{
   string t = s;
   StringToLower(t);
   return t;
}

bool ContainsI(string text, string needle)
{
   return StringFind(ToLowerSafe(text), ToLowerSafe(needle)) >= 0;
}

double Clamp(double v, double lo, double hi)
{
   if(v < lo) return lo;
   if(v > hi) return hi;
   return v;
}

bool IsNewBar()
{
   static datetime lastBar = 0;
   datetime current = iTime(Symbol(), Period(), 0);
   if(current != lastBar)
   {
      lastBar = current;
      return true;
   }
   return false;
}

int CountOpenPositions()
{
   int count = 0;
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != InpMagicNumber) continue;
      if(OrderType() == OP_BUY || OrderType() == OP_SELL) count++;
   }
   return count;
}

double CurrentSpreadPoints()
{
   return (Ask - Bid) / Point;
}

double CalculateLotSize(int stopLossPoints)
{
   if(!InpUseRiskSizing) return InpBaseLots;
   double riskMoney = AccountBalance() * (InpRiskPerTradePercent / 100.0);
   if(riskMoney <= 0.0 || stopLossPoints <= 0) return InpBaseLots;

   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize  = MarketInfo(Symbol(), MODE_TICKSIZE);
   if(tickValue <= 0.0 || tickSize <= 0.0) return InpBaseLots;

   double pointValuePerLot = tickValue * (Point / tickSize);
   if(pointValuePerLot <= 0.0) return InpBaseLots;

   double lots = riskMoney / (stopLossPoints * pointValuePerLot);
   double minLot = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot = MarketInfo(Symbol(), MODE_MAXLOT);
   double step   = MarketInfo(Symbol(), MODE_LOTSTEP);
   if(step <= 0.0) step = 0.01;

   lots = Clamp(lots, minLot, maxLot);
   lots = MathFloor(lots / step) * step;
   lots = NormalizeDouble(lots, 2);
   if(lots < minLot) lots = minLot;
   return lots;
}

int DetectInstitutionalBreakout()
{
   if(!InpUseInstitutionLogic) return 0;
   if(Bars < 20) return 0;

   double close1 = iClose(Symbol(), Period(), 1);
   double close2 = iClose(Symbol(), Period(), 2);
   double dayHigh = iHigh(Symbol(), PERIOD_D1, 1);
   double dayLow  = iLow(Symbol(), PERIOD_D1, 1);

   double stepPrice = InpInstitutionStepPoints * Point;
   if(stepPrice <= 0.0) return 0;
   double level = MathRound(close1 / stepPrice) * stepPrice;

   bool brokeUpRound   = (close2 <= level && close1 > level);
   bool brokeDownRound = (close2 >= level && close1 < level);
   bool brokeUpDay     = close1 > dayHigh;
   bool brokeDownDay   = close1 < dayLow;

   if(brokeUpRound || brokeUpDay) return 1;
   if(brokeDownRound || brokeDownDay) return -1;
   return 0;
}

void ComputeAdaptiveParams(int regimeSignal, int &slPoints, int &tpPoints, int &trailPoints)
{
   double atr = iATR(Symbol(), Period(), InpATRPeriod, 1);
   double atrPts = 0.0;
   if(Point > 0.0) atrPts = atr / Point;

   double regimeVol = 1.0;
   if(atrPts > 0)
      regimeVol = Clamp(atrPts / 500.0, 0.60, 1.80);

   double memoryBias = 1.0;
   if(g_recentTrades >= 10)
   {
      if(g_recentWinRate < 0.45 || g_recentProfitFactor < 0.95) memoryBias = 1.25;
      if(g_recentWinRate > 0.60 && g_recentProfitFactor > 1.20) memoryBias = 0.90;
   }

   double behaviorBias = 1.0;
   if(g_behaviorMode == 0) behaviorBias = 1.25;
   if(g_behaviorMode == 2) behaviorBias = 0.85;

   double breakoutBias = 1.0;
   if(regimeSignal != 0) breakoutBias = 0.85;

   slPoints = (int)MathRound(InpBaseStopLossPoints * regimeVol * memoryBias * behaviorBias);
   tpPoints = (int)MathRound(InpBaseTakeProfitPoints * regimeVol * breakoutBias * (2.0 - behaviorBias));
   trailPoints = (int)MathRound(InpBaseTrailingStopPoints * regimeVol * memoryBias);

   slPoints = (int)Clamp(slPoints, 120, 5000);
   tpPoints = (int)Clamp(tpPoints, 120, 8000);
   trailPoints = (int)Clamp(trailPoints, 80, 4000);
}

void AddSignal(double &buyScore, double &sellScore, double direction, double confidence, double weight)
{
   if(direction > 0) buyScore += confidence * weight;
   if(direction < 0) sellScore += confidence * weight;
}

void CoreSignals(double &buyScore, double &sellScore)
{
   double fastNow = iMA(Symbol(), Period(), InpFastMAPeriod, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slowNow = iMA(Symbol(), Period(), InpSlowMAPeriod, 0, MODE_EMA, PRICE_CLOSE, 1);
   double fastPrev = iMA(Symbol(), Period(), InpFastMAPeriod, 0, MODE_EMA, PRICE_CLOSE, 2);
   double slowPrev = iMA(Symbol(), Period(), InpSlowMAPeriod, 0, MODE_EMA, PRICE_CLOSE, 2);
   double rsi = iRSI(Symbol(), Period(), InpRSIPeriod, PRICE_CLOSE, 1);
   double mom0 = iMomentum(Symbol(), Period(), 14, PRICE_CLOSE, 1);
   double mom1 = iMomentum(Symbol(), Period(), 14, PRICE_CLOSE, 2);

   if(fastPrev <= slowPrev && fastNow > slowNow) AddSignal(buyScore, sellScore, 1, 0.80, 1.20);
   if(fastPrev >= slowPrev && fastNow < slowNow) AddSignal(buyScore, sellScore, -1, 0.80, 1.20);

   if(rsi < 30.0) AddSignal(buyScore, sellScore, 1, 0.65, 0.80);
   if(rsi > 70.0) AddSignal(buyScore, sellScore, -1, 0.65, 0.80);

   if(mom0 > 100.0 && mom0 > mom1) AddSignal(buyScore, sellScore, 1, 0.60, 0.90);
   if(mom0 < 100.0 && mom0 < mom1) AddSignal(buyScore, sellScore, -1, 0.60, 0.90);
}

void LegacyBotVotes(double &buyScore, double &sellScore)
{
   if(g_botCount <= 0) return;

   double fast = iMA(Symbol(), Period(), 20, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slow = iMA(Symbol(), Period(), 55, 0, MODE_EMA, PRICE_CLOSE, 1);
   double rsi  = iRSI(Symbol(), Period(), 14, PRICE_CLOSE, 1);
   double close1 = iClose(Symbol(), Period(), 1);
   double close2 = iClose(Symbol(), Period(), 2);

   for(int i = 0; i < g_botCount; i++)
   {
      if(g_botEnabled[i] == 0) continue;

      string n = g_botNames[i];
      double w = g_botWeights[i];
      int dir = 0;
      double conf = 0.40;

      if(ContainsI(n, "hightower") || ContainsI(n, "trend"))
      {
         dir = (fast > slow) ? 1 : -1;
         conf = 0.58;
      }
      else if(ContainsI(n, "ladder") || ContainsI(n, "knot") || ContainsI(n, "sauce"))
      {
         if(rsi < 33.0) dir = 1;
         if(rsi > 67.0) dir = -1;
         conf = 0.52;
      }
      else if(ContainsI(n, "cc") || ContainsI(n, "culture") || ContainsI(n, "kingdom") || ContainsI(n, "soro"))
      {
         if(close1 > close2) dir = 1;
         if(close1 < close2) dir = -1;
         conf = 0.50;
      }
      else
      {
         dir = (close1 >= fast) ? 1 : -1;
         conf = 0.46;
      }

      AddSignal(buyScore, sellScore, dir, conf, w);
   }
}

void ApplyRegimeVote(double &buyScore, double &sellScore, int regimeSignal)
{
   if(regimeSignal == 1) AddSignal(buyScore, sellScore, 1, 0.85, 1.60);
   if(regimeSignal == -1) AddSignal(buyScore, sellScore, -1, 0.85, 1.60);
}

int FinalDirection(double buyScore, double sellScore, double &confidence)
{
   double total = buyScore + sellScore;
   if(total <= 0.0)
   {
      confidence = 0.0;
      return 0;
   }

   double buyRatio = buyScore / total;
   double sellRatio = sellScore / total;
   confidence = MathMax(buyRatio, sellRatio);

   if(buyRatio >= InpVoteThreshold && buyRatio > sellRatio) return 1;
   if(sellRatio >= InpVoteThreshold && sellRatio > buyRatio) return -1;
   return 0;
}

void ManageTrailingStops(int trailPoints)
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != InpMagicNumber) continue;
      if(OrderType() != OP_BUY && OrderType() != OP_SELL) continue;

      if(OrderType() == OP_BUY)
      {
         double newSL = Bid - trailPoints * Point;
         if(OrderStopLoss() < newSL && newSL < Bid)
            OrderModify(OrderTicket(), OrderOpenPrice(), NormalizeDouble(newSL, Digits), OrderTakeProfit(), 0, clrGreen);
      }
      else
      {
         double newSL = Ask + trailPoints * Point;
         if((OrderStopLoss() == 0 || OrderStopLoss() > newSL) && newSL > Ask)
            OrderModify(OrderTicket(), OrderOpenPrice(), NormalizeDouble(newSL, Digits), OrderTakeProfit(), 0, clrRed);
      }
   }
}

void SaveMemory()
{
   if(!InpUsePersistentMemory) return;

   GlobalVariableSet("DFQ_WINRATE_" + Symbol(), g_recentWinRate);
   GlobalVariableSet("DFQ_AVGR_" + Symbol(), g_recentAvgR);
   GlobalVariableSet("DFQ_PF_" + Symbol(), g_recentProfitFactor);
   GlobalVariableSet("DFQ_TRADES_" + Symbol(), g_recentTrades);
   GlobalVariableSet("DFQ_MODE_" + Symbol(), g_behaviorMode);

   int h = FileOpen(InpMemoryFile, FILE_CSV | FILE_WRITE | FILE_COMMON, ',');
   if(h == INVALID_HANDLE) return;
   FileWrite(h, "Symbol", "WinRate", "AvgR", "ProfitFactor", "Trades", "Mode");
   FileWrite(h, Symbol(), DoubleToString(g_recentWinRate, 6), DoubleToString(g_recentAvgR, 6), DoubleToString(g_recentProfitFactor, 6), IntegerToString(g_recentTrades), IntegerToString(g_behaviorMode));
   FileClose(h);
}

void LoadMemory()
{
   if(!InpUsePersistentMemory) return;

   if(GlobalVariableCheck("DFQ_WINRATE_" + Symbol())) g_recentWinRate = GlobalVariableGet("DFQ_WINRATE_" + Symbol());
   if(GlobalVariableCheck("DFQ_AVGR_" + Symbol())) g_recentAvgR = GlobalVariableGet("DFQ_AVGR_" + Symbol());
   if(GlobalVariableCheck("DFQ_PF_" + Symbol())) g_recentProfitFactor = GlobalVariableGet("DFQ_PF_" + Symbol());
   if(GlobalVariableCheck("DFQ_TRADES_" + Symbol())) g_recentTrades = (int)GlobalVariableGet("DFQ_TRADES_" + Symbol());
   if(GlobalVariableCheck("DFQ_MODE_" + Symbol())) g_behaviorMode = (int)GlobalVariableGet("DFQ_MODE_" + Symbol());
}

void UpdateBehaviorMode()
{
   if(g_recentTrades < 10)
   {
      g_behaviorMode = 1;
      return;
   }

   if(g_recentWinRate < 0.45 || g_recentProfitFactor < 0.95)
      g_behaviorMode = 0;
   else if(g_recentWinRate > 0.62 && g_recentProfitFactor > 1.25)
      g_behaviorMode = 2;
   else
      g_behaviorMode = 1;
}

void ProcessClosedTrades()
{
   int total = OrdersHistoryTotal();
   if(total <= 0) return;

   int looked = 0;
   int wins = 0;
   int losses = 0;
   double grossWin = 0.0;
   double grossLoss = 0.0;

   for(int i = total - 1; i >= 0 && looked < 50; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != InpMagicNumber) continue;
      if(OrderCloseTime() <= g_lastClosedScanTime) continue;
      if(OrderType() != OP_BUY && OrderType() != OP_SELL) continue;

      double pnl = OrderProfit() + OrderSwap() + OrderCommission();
      if(pnl >= 0)
      {
         wins++;
         grossWin += pnl;
      }
      else
      {
         losses++;
         grossLoss += MathAbs(pnl);
      }
      looked++;
   }

   if(looked > 0)
   {
      int totalTrades = wins + losses;
      g_recentTrades = MathMin(200, g_recentTrades + totalTrades);
      g_recentWinRate = ((g_recentWinRate * 0.70) + (((double)wins / MathMax(totalTrades, 1)) * 0.30));
      double pf = (grossLoss > 0.0) ? (grossWin / grossLoss) : (grossWin > 0.0 ? 3.0 : 1.0);
      g_recentProfitFactor = (g_recentProfitFactor * 0.70) + (pf * 0.30);
      g_recentAvgR = (g_recentAvgR * 0.80) + (((grossWin - grossLoss) / MathMax(totalTrades, 1)) * 0.20);
      g_lastClosedScanTime = TimeCurrent();
      UpdateBehaviorMode();
      SaveMemory();
   }
}

void LoadManifestDefaults()
{
   string defaults[] = {
      "DF_HIGHTOWER_V10_FULL",
      "DF_HIGHTOWER_ADAPTIVE_V7",
      "DFHIGHTOWERV6",
      "DF KNOT +AUTOFLIP",
      "DF LADDER RV",
      "DF SAUCE FINAL",
      "KINGDOM MANNER - ULTIMATE PACKAGE",
      "Kingdom Manner + Scale + Margin Close",
      "CC V2.5.2.1",
      "CULTURE COIN V.1",
      "GOLDSETUP",
      "SORO + IMB SCALER"
   };

   g_botCount = ArraySize(defaults);
   ArrayResize(g_botNames, g_botCount);
   ArrayResize(g_botWeights, g_botCount);
   ArrayResize(g_botEnabled, g_botCount);

   for(int i = 0; i < g_botCount; i++)
   {
      g_botNames[i] = defaults[i];
      g_botWeights[i] = 1.0;
      g_botEnabled[i] = 1;
   }
}

void LoadBotManifest()
{
   int h = FileOpen(InpBotManifestFile, FILE_CSV | FILE_READ | FILE_COMMON, ',');
   if(h == INVALID_HANDLE)
   {
      LoadManifestDefaults();
      return;
   }

   string header1 = FileReadString(h);
   string header2 = FileReadString(h);
   string header3 = FileReadString(h);
   string header4 = FileReadString(h);

   int capacity = 0;
   while(!FileIsEnding(h))
   {
      string name = FileReadString(h);
      if(name == "") break;
      string enabledStr = FileReadString(h);
      string weightStr = FileReadString(h);
      string groupStr = FileReadString(h);

      int enabled = (int)StrToInteger(enabledStr);
      double weight = StrToDouble(weightStr);
      if(weight <= 0.0) weight = 1.0;

      ArrayResize(g_botNames, capacity + 1);
      ArrayResize(g_botWeights, capacity + 1);
      ArrayResize(g_botEnabled, capacity + 1);
      g_botNames[capacity] = name;
      g_botWeights[capacity] = weight;
      g_botEnabled[capacity] = enabled;
      capacity++;
   }
   FileClose(h);
   g_botCount = capacity;

   if(g_botCount <= 0)
      LoadManifestDefaults();
}

int SendEntry(int direction, int slPoints, int tpPoints)
{
   double lots = CalculateLotSize(slPoints);
   int ticket = -1;

   if(direction > 0 && InpAllowBuy)
   {
      double sl = NormalizeDouble(Ask - slPoints * Point, Digits);
      double tp = NormalizeDouble(Ask + tpPoints * Point, Digits);
      ticket = OrderSend(Symbol(), OP_BUY, lots, Ask, InpSlippage, sl, tp, "DF QUANTUM BUY", InpMagicNumber, 0, clrBlue);
   }
   else if(direction < 0 && InpAllowSell)
   {
      double sl = NormalizeDouble(Bid + slPoints * Point, Digits);
      double tp = NormalizeDouble(Bid - tpPoints * Point, Digits);
      ticket = OrderSend(Symbol(), OP_SELL, lots, Bid, InpSlippage, sl, tp, "DF QUANTUM SELL", InpMagicNumber, 0, clrRed);
   }

   if(ticket > 0)
   {
      g_lastTradeBarTime = iTime(Symbol(), Period(), 0);
      return ticket;
   }
   return -1;
}

int OnInit()
{
   LoadMemory();
   LoadBotManifest();
   g_lastClosedScanTime = TimeCurrent() - 86400;
   Print("DF QUANTUM initialized. Bots loaded: ", g_botCount);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   SaveMemory();
}

void OnTick()
{
   ProcessClosedTrades();

   int regimeNow = DetectInstitutionalBreakout();
   int slDyn = InpBaseStopLossPoints;
   int tpDyn = InpBaseTakeProfitPoints;
   int trailPts = InpBaseTrailingStopPoints;
   ComputeAdaptiveParams(regimeNow, slDyn, tpDyn, trailPts);
   ManageTrailingStops(trailPts);

   if(!IsNewBar()) return;
   if(CountOpenPositions() > 0) return;
   if(CurrentSpreadPoints() > InpMaxSpreadPoints) return;

   datetime currentBar = iTime(Symbol(), Period(), 0);
   if(g_lastTradeBarTime > 0)
   {
      int barsSince = iBarShift(Symbol(), Period(), g_lastTradeBarTime, true);
      if(barsSince >= 0 && barsSince < InpMinBarsBetweenTrades) return;
   }

   double buyScore = 0.0;
   double sellScore = 0.0;
   CoreSignals(buyScore, sellScore);
   LegacyBotVotes(buyScore, sellScore);

   int regime = regimeNow;
   ApplyRegimeVote(buyScore, sellScore, regime);

   int slPts = slDyn;
   int tpPts = tpDyn;

   double conf = 0.0;
   int direction = FinalDirection(buyScore, sellScore, conf);
   if(direction == 0) return;

   if(conf < InpVoteThreshold) return;
   SendEntry(direction, slPts, tpPts);
}
