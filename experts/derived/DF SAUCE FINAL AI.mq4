//+------------------------------------------------------------------+
//| DF_XNG_ZZ_TREND_LADDER_WYCKOFF_WISDO_V61_MIXED.mq4                |
//| V6.1 MIX = V6 FLOW LADDER (structure + DD cap + reclaim)          |
//|            + V5.2 STATIONS/DASHBOARD/GOV/CAPITAL TRAIL             |
//|                                                                  |
//| KEY FIX: "wasn't taking profit"                                   |
//| - StepProfit / SuperScalp now closes ONLY NON-ANCHOR orders by     |
//|   default (ladders + DD). Anchor stays as thesis unless you enable|
//|   closing it.                                                     |
//| - Ladder wipe logic: A) close ladder trades only, keep anchor      |
//| - D) ladder reopens immediately if reclaim confirmed (ZZ reclaim)  |
//| - C) tighten anchor SL immediately on structure flip against cycle |
//+------------------------------------------------------------------+
#property strict

//==================================================================//
//======================= AI OVERLAY (NEW) =========================//
//==================================================================//
input string INP_SEC_AI = "=== AI Overlay (Decision Assist) ===";
input bool   InpAI_Enable                 = true;
input bool   InpAI_UseExternalFeed        = true;
input string InpAI_ExternalFeedFile       = "TE\\ai\\consensus.csv"; // FILE_COMMON
input double InpAI_MinConfidence          = 0.55;  // [0..1]
input bool   InpAI_BlockAgainstConsensus  = true;
input double InpAI_DefaultLotMultiplier   = 1.00;
input int    InpAI_MaxFeedAgeSeconds      = 120;

//==================================================================//
//======================== WISDO CORE (INLINE) ======================//
//==================================================================//
enum WISDO_MODE { WISDO_OFFLINE, WISDO_TRACK_ONLY, WISDO_CULTURE_BOT };
enum WISDO_COPY { WISDO_COPY_LOCKED, WISDO_COPY_SUBSCRIBERS_ONLY };

input string     INP_SEC_WISDO = "=== WISDO (Telemetry / Copy Control) ===";
input WISDO_MODE InpWisdoMode  = WISDO_OFFLINE;
input WISDO_COPY InpWisdoCopy  = WISDO_COPY_LOCKED;
input bool       InpWisdoPerSymbolFiles = true;
input int        InpWisdoWriteRetries   = 5;
input int        InpWisdoRetryMs        = 80;

string WisdoTraderId()
{
   string raw = IntegerToString(AccountNumber()) + "|" + AccountCompany();
   int h = 2166136261;
   for(int i=0;i<StringLen(raw);i++){ h ^= StringGetChar(raw,i); h *= 16777619; }
   return "WSD-" + StringFormat("%08X",h);
}

bool WisdoApproved()
{
   if(InpWisdoMode != WISDO_CULTURE_BOT) return false;
   int fh = FileOpen("WISDO\\registry\\culture_approved.json",
                     FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI|FILE_SHARE_READ|FILE_SHARE_WRITE);
   if(fh < 0) return false;

   string data="";
   while(!FileIsEnding(fh)) data += FileReadString(fh) + " ";
   FileClose(fh);

   return (StringFind(data, WisdoTraderId()) >= 0 && StringFind(data, "true") >= 0);
}

string WisdoFeedPath()
{
   if(!InpWisdoPerSymbolFiles) return "WISDO\\feeds\\trades.jsonl";
   string sym = Symbol();
   sym = StringReplace(sym,"/","_");
   sym = StringReplace(sym,"\\","_");
   sym = StringReplace(sym,":","_");
   return "WISDO\\feeds\\trades_"+sym+".jsonl";
}

bool WisdoWriteLineSafe(string line)
{
   if(InpWisdoMode==WISDO_OFFLINE) return true;

   string path = WisdoFeedPath();
   int tries = MathMax(InpWisdoWriteRetries,1);

   for(int attempt=0; attempt<tries; attempt++)
   {
      ResetLastError();
      int f = FileOpen(path, FILE_COMMON|FILE_READ|FILE_WRITE|FILE_TXT|FILE_ANSI|FILE_SHARE_READ|FILE_SHARE_WRITE);
      if(f>=0)
      {
         FileSeek(f,0,SEEK_END);
         FileWrite(f,line);
         FileClose(f);
         return true;
      }
      Sleep(MathMax(InpWisdoRetryMs,10));
   }
   return false;
}

void WisdoWrite(string event,string dir,int ticket,double lots,double price,string tag)
{
   if(InpWisdoMode==WISDO_OFFLINE) return;

   string j =
      "{"
      "\"event\":\""+event+"\","+
      "\"timestamp\":"+IntegerToString(TimeCurrent())+","+
      "\"trader\":\""+WisdoTraderId()+"\","+
      "\"symbol\":\""+Symbol()+"\","+
      "\"direction\":\""+dir+"\","+
      "\"lots\":"+DoubleToString(lots,2)+","+
      "\"price\":"+DoubleToString(price,Digits)+","+
      "\"ticket\":"+IntegerToString(ticket)+","+
      "\"culture\":"+(WisdoApproved()?"true":"false")+","+
      "\"copyable\":"+((WisdoApproved() && InpWisdoCopy==WISDO_COPY_SUBSCRIBERS_ONLY)?"true":"false")+","+
      "\"tag\":\""+tag+"\""
      "}";

   WisdoWriteLineSafe(j);
}

int AIDirFromString(string s)
{
   string u=StringToUpper(s);
   if(StringFind(u,"BUY")>=0 || StringFind(u,"LONG")>=0 || StringFind(u,"1")>=0) return 1;
   if(StringFind(u,"SELL")>=0 || StringFind(u,"SHORT")>=0 || StringFind(u,"-1")>=0) return -1;
   return 0;
}

bool AIReadConsensus(int &dir,double &conf,double &lotMult,string &note)
{
   dir=0; conf=0; lotMult=InpAI_DefaultLotMultiplier; note="AI: default";
   if(!InpAI_Enable) { note="AI disabled"; return true; }
   if(!InpAI_UseExternalFeed) return true;

   int f=FileOpen(InpAI_ExternalFeedFile, FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI|FILE_SHARE_READ|FILE_SHARE_WRITE);
   if(f<0) { note="AI feed missing"; return true; }

   string line="",last="";
   while(!FileIsEnding(f))
   {
      line=FileReadString(f);
      if(StringLen(line)>3) last=line;
   }
   FileClose(f);

   if(StringLen(last)<3) { note="AI feed empty"; return true; }

   string p[];
   int n=StringSplit(last,',',p);
   if(n<5) { note="AI feed format invalid"; return true; }

   string sym=p[0];
   if(sym!=Symbol() && sym!="*") { note="AI symbol mismatch"; return true; }

   int d=AIDirFromString(p[1]);
   double c=StrToDouble(p[2]);
   double lm=StrToDouble(p[3]);
   int ts=(int)StrToInteger(p[4]);

   if(ts>0 && (TimeCurrent()-ts)>InpAI_MaxFeedAgeSeconds)
   {
      note="AI feed stale";
      return true;
   }

   dir=d;
   conf=c;
   if(lm>0) lotMult=lm;
   note="AI consensus loaded";
   return true;
}

bool AIAllowTrade(bool buy,double &lotAdj,string &reason)
{
   lotAdj=InpAI_DefaultLotMultiplier;
   reason="AI pass";

   if(!InpAI_Enable) return true;

   int aiDir=0;
   double aiConf=0.0, aiLot=InpAI_DefaultLotMultiplier;
   string aiNote="";
   AIReadConsensus(aiDir,aiConf,aiLot,aiNote);

   if(aiDir==0)
   {
      reason="AI neutral: "+aiNote;
      return true;
   }

   if(aiConf<InpAI_MinConfidence)
   {
      reason="AI confidence below threshold";
      return false;
   }

   int tradeDir = buy ? 1 : -1;
   if(InpAI_BlockAgainstConsensus && aiDir!=tradeDir)
   {
      reason="AI blocked opposite trade";
      return false;
   }

   if(aiDir==tradeDir)
   {
      lotAdj=MathMax(0.10,MathMin(3.00,aiLot));
      reason="AI aligned trade";
   }

   return true;
}
//==================================================================//
//============================ INPUTS ===============================//
//==================================================================//
input string INP_SEC_ID = "=== Identity / Execution ===";
input int    InpMagicNumber_ForThisEA = 1999;
input int    InpSlippagePoints        = 3;

input string INP_SEC_LIMITS = "=== Orders / Pools (Primary vs Drawdown) ===";
input int    InpMaxOrdersTotal_UserSets = 20;
input int    InpOneEntryPerClosedBar    = 1;

input string INP_SEC_LOT = "=== Lot / Risk ===";
input int    InpLotMode_UseFixedLot     = 0;
input double InpFixedLotSize            = 0.10;
input double InpRiskPercentPerTrade     = 5.0;

input string INP_SEC_WYCKOFF = "=== Wyckoff Gate (Expansion-only anchor entries) ===";
input int    InpATR_Period_Expansion        = 14;
input double InpExpansionRange_ATR_Min      = 0.60;
input int    InpExpansionLookback_Strict    = 3;
input int    InpMaxSpreadPoints_EntryBlock  = 999999;

input string INP_SEC_SL = "=== Safety SL (Broker) + Capital Trail (Authoritative Stop) ===";
input double InpATR_SL_Multiplier        = 1.20;
input int    InpATR_SL_BufferPoints      = 50;
input bool InpBreakEven_Enable = true;

input bool   InpCapitalTrail_Enable      = true;
input double InpCapitalTrail_ProtectPct  = 35.0;
input double InpCapitalTrail_MaxDDPct    = 20.0;
input double InpCapitalTrail_ActivationPct = 0.8;

input string INP_SEC_EXIT = "=== Exit Mode (Profit Taking) ===";
input int    InpExit_StepProfitEnable    = 1;
input double InpExit_ProfitStepPrice     = 0.010;

input int    InpExit_SuperScalpEnable    = 0;
input double InpExit_SuperScalp_RR_Base  = 2.0;
input double InpExit_SuperScalp_RR_High  = 3.0;
input int    InpExit_SuperScalp_WRBoost  = 75;

// IMPORTANT: default keep anchor open (your request)
input bool   InpExit_ApplyToAnchorToo    = false;

input string INP_SEC_GOV = "=== Equity Governor (Cooldown + Daily Max Triggers) ===";
input bool   InpGov_Enable                 = true;
input double InpGov_GainTriggerPct         = 30.0;
input int    InpGov_CooldownMinutes        = 25;
input int    InpGov_MaxTriggersPerDay      = 2;

input string INP_SEC_ZZ = "=== Trend / ZigZag Structure ===";
input int    InpZZ_Depth      = 12;
input int    InpZZ_Deviation  = 5;
input int    InpZZ_Backstep   = 3;
input int    InpZZ_LookbackBars= 200;
input int    InpZZ_MinSwings  = 2;
input int    InpStructure_MinSwingPoints = 150;

input string INP_SEC_FILTERS = "=== Confirmation Filters (EMA / TrendScore / Volatility) ===";
input bool   InpFilter_UseEMA         = true;
input int    InpEMA_Period            = 50;
input ENUM_TIMEFRAMES InpEMA_TF       = PERIOD_M15;
input double InpEMA_MinSlopePoints    = 10;
input int    InpEMA_SlopeLookbackBars = 5;

input bool   InpFilter_UseTrendScore  = true;
input double InpTrendScore_Min        = 60.0;

input bool   InpFilter_UseVolatility  = true;
input ENUM_TIMEFRAMES InpATR_TF_Vol   = PERIOD_M15;
input int    InpATR_Period_Vol        = 14;
input double InpATR_MinPoints         = 120;

input string INP_SEC_LADDER_FLOW = "=== V6 FLOW LADDER (Primary extractor) ===";
enum LadderSpacingMode { LADDER_ARITH=0, LADDER_GEO=1 };
input LadderSpacingMode InpFlowSpacingMode = LADDER_GEO;
input int    InpFlow_LadderStepPoints   = 50;
input double InpFlow_GeoMultiplier      = 1.5;
input int    InpFlow_MaxAdds_UserSet    = 20;

enum LadderLotMode { LOT_FIXED=0, LOT_GEO=1, LOT_ARITH=2 };
input LadderLotMode InpFlowLotScaling  = LOT_GEO;
input double InpFlowLotMultiplier      = 1.20;
input double InpFlowLotIncrement       = 0.01;

input bool   InpUseExpansionAdd      = true;
input double InpLadderExpATRMult     = 1.05;
input bool   InpUseContinuationAdd   = true;
input int    InpPullbackMinPoints    = 25;
input bool   InpUseRiskFreeAdd       = true;
input bool   InpUseStructureBreakAdd = true;

input int    InpMinSecondsBetweenAdds = 60;

// Profit trigger -> anchor risk-free
input double InpProfitTriggerPips   = 2.0;
input bool   InpUseBasketProfit     = true;

// Ladder DD cap (A: close ladders only, keep anchor)
input double InpLargestWinFallbackMoney = 15.0;
input double InpLadderDDCapFraction     = 0.333333;

// Structure flip safety (C: tighten anchor SL immediately)
input int    InpAnchorTightenBufferPts  = 50;

// Drawdown ladder (kept from V5.2) (SAME direction as anchor)
input string INP_SEC_DDL = "=== Drawdown Ladder (Same direction; armed by opposite expansion) ===";
input bool   InpDD_Enable                 = true;
input int    InpDD_SpacingPoints          = 80;
input double InpDD_LotFactorOfBase        = 0.50;
input int    InpDD_MaxAdds_UserSet        = 20;

input string INP_SEC_STATION = "=== Build Stations (H1 BOS) ===";
input bool   InpStation_Enable              = true;
input int    InpStation_H1PivotRadius        = 2;
input int    InpStation_H1ScanBars           = 250;
input int    InpStation_AddsTargetPerImpulse = 12;
input int    InpStation_MinExpansionPoints   = 200;
input bool   InpStation_DrawFancy            = true;

input string INP_SEC_VIS = "=== Day High/Low & Dashboard ===";
input bool   InpShowDayHL = true;

input bool   InpShowDashboard = true;
input int    InpDashCorner = CORNER_LEFT_UPPER;
input int    InpDashX = 10;
input int    InpDashY = 10;

input string INP_SEC_STATS = "=== Stats (Winrate) ===";
input int    InpRollingN = 50;

//==================================================================//
//============================ GLOBALS ==============================//
//==================================================================//
int g_outcomes[];
int g_outcomeCount=0;
int g_RollingN=0;

int    gRankPoints=0, gBestRankPoints=0;
string gRank="BRONZE";
color  gRankColor=clrGray;
color  g_themeColor=clrSilver;
double gLastEquityHigh=0;

double g_anchorPrice=0;
int    g_cycleDir=0;
double g_baseLot=0;

int    g_primaryAdds=0;   // FLOW adds count
int    g_drawdownAdds=0;

int gMaxPrimaryOrders=0;
int gMaxDrawdownOrders=0;

datetime g_lastTradeTime=0;
datetime g_lastExpansionTime=0;

double   gEquityBaseline=0;
bool     gGovernorLocked=false;
datetime g_cdUntil=0;
string   g_cdReason="";
int      gGovTriggersToday=0;
datetime gGovDayStart=0;
bool     gDailyIdle=false;

double gAnchorEquity=0;
double gPeakEquity=0;

datetime gDayStart=0;
double   gDayHigh=0, gDayLow=0, gPrevDayHigh=0, gPrevDayLow=0;

string g_LastDecisionReason="INIT";
string g_LastWaitReason="INIT";
double gTrendScore=0;

// ===== Stations =====
struct BUILD_STATION
{
   datetime bosTime;
   double   bosPrice;

   datetime peakTime;
   double   peakPrice;

   double   expansionPoints;
   int      dir; // +1 buy, -1 sell
};
BUILD_STATION gStations[3];
int gStationCount=0;
int gActiveStation=-1;

datetime gLastH1BarTime=0;
double gLastPivotHigh=0, gLastPivotLow=0;
datetime gLastPivotHighTime=0, gLastPivotLowTime=0;

datetime gLastAddTime=0;
bool gFreezeAdds=false;
double gLastPrimaryRef=0;

// ===== V6 structure state =====
double   g_lastHigh=0, g_prevHigh=0, g_lastLow=0, g_prevLow=0;
string   g_lastHighTag="", g_lastLowTag="";
datetime g_lastStructUpdate=0;

// ===== V6 ladder state =====
double   g_lastAddRefPrice=0;
bool     g_ladderLocked=false;
double   g_reclaimLine=0;
double   g_pullbackMaxAgainstPts=0;
double   g_lastFavorablePeakPts=0;

//==================================================================//
//============================ UTILS ================================//
//==================================================================//
double ATR(int period,int shift){ return iATR(Symbol(),0,period,shift); }
double Range(int shift){ return (High[shift]-Low[shift]); }

bool CooldownActive(){ return (TimeCurrent() < g_cdUntil); }
int CooldownRemainingSec(){ int rem=(int)(g_cdUntil-TimeCurrent()); if(rem<0) rem=0; return rem; }

string CooldownTextFull()
{
   if(!CooldownActive()) return "Cooldown: OFF";
   int sec=CooldownRemainingSec();
   int mm=sec/60, ss=sec%60;
   return "Cooldown: ON ("+IntegerToString(mm)+"m "+IntegerToString(ss)+"s) "+g_cdReason;
}
void StartCooldownMinutes(int mins,string reason)
{
   if(mins<=0){ g_cdUntil=0; g_cdReason=""; return; }
   g_cdUntil = TimeCurrent()+mins*60;
   g_cdReason=reason;
}

double PipValuePoint()
{
   double tv=MarketInfo(Symbol(),MODE_TICKVALUE);
   double ts=MarketInfo(Symbol(),MODE_TICKSIZE);
   if(ts<=0) ts=Point;
   return tv*(Point/ts);
}
double PipMoneyPerLot()
{
   int pipPoints=(Digits==3||Digits==5)?10:1;
   return PipValuePoint()*pipPoints;
}

double PipValue()
{
   return PipValuePoint();
}

double NormalizeLot(double lot)
{
   double minLot=MarketInfo(Symbol(),MODE_MINLOT);
   double maxLot=MarketInfo(Symbol(),MODE_MAXLOT);
   double step=MarketInfo(Symbol(),MODE_LOTSTEP);
   if(step<=0) step=0.01;

   lot=MathMax(lot,minLot);
   lot=MathMin(lot,maxLot);
   lot=MathFloor(lot/step)*step;
   if(lot<minLot) lot=minLot;
   return NormalizeDouble(lot,2);
}

double CalcLot_Risk(double sl,bool buy)
{
   double ep=buy?Ask:Bid;
   double distPoints=MathAbs(ep-sl)/Point;
   if(distPoints<=1) return 0;
   double riskMoney=AccountBalance()*InpRiskPercentPerTrade/100.0;
   double lot=riskMoney/(distPoints*PipValue());
   return NormalizeLot(lot);
}
double BuildBaseLot(bool buy,double sl)
{
   if(InpLotMode_UseFixedLot==1) return NormalizeLot(InpFixedLotSize);
   return CalcLot_Risk(sl,buy);
}

int CountOpenByMagic()
{
   int c=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
      if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES))
         if(OrderMagicNumber()==InpMagicNumber_ForThisEA && OrderSymbol()==Symbol())
            c++;
   return c;
}

bool IsAnchorComment(string c){ return (StringFind(c,"ANCHOR")>=0); }
bool IsPrimaryComment(string c){ return (StringFind(c,"LADDER")>=0 || StringFind(c,"PRIM")>=0); }
bool IsDDComment(string c){ return (StringFind(c,"DD")>=0); }

int CountOpenPrimary()
{
   int c=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
      if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES))
         if(OrderMagicNumber()==InpMagicNumber_ForThisEA && OrderSymbol()==Symbol())
         {
            string cm=OrderComment();
            if(IsAnchorComment(cm) || IsPrimaryComment(cm)) c++;
         }
   return c;
}
int CountOpenDrawdown()
{
   int c=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
      if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES))
         if(OrderMagicNumber()==InpMagicNumber_ForThisEA && OrderSymbol()==Symbol())
            if(IsDDComment(OrderComment())) c++;
   return c;
}

double BuildATR_SL(bool buy)
{
   double atr=ATR(InpATR_Period_Expansion,1);
   if(atr<=0) atr=10*Point;
   double dist=atr*InpATR_SL_Multiplier + (InpATR_SL_BufferPoints*Point);
   double entry=buy?Ask:Bid;
   return buy ? (entry-dist) : (entry+dist);
}

int OpenOrder(double lot,bool buy,double sl,string tag)
{
   double aiLotAdj=InpAI_DefaultLotMultiplier;
   string aiReason="";
   if(!AIAllowTrade(buy,aiLotAdj,aiReason))
   {
      g_LastWaitReason = "WAIT: " + aiReason;
      return -1;
   }

   lot=NormalizeLot(lot*aiLotAdj);
   if(lot<=0)
   {
      g_LastWaitReason = "WAIT: AI lot <= 0";
      return -1;
   }

   int type=buy?OP_BUY:OP_SELL;
   double price=buy?Ask:Bid;
   int t=OrderSend(Symbol(),type,lot,price,InpSlippagePoints,sl,0,tag,InpMagicNumber_ForThisEA,0,g_themeColor);
   if(t>0)
   {
      g_lastTradeTime=TimeCurrent();
      WisdoWrite("OPEN",buy?"BUY":"SELL",t,lot,price,tag+"|"+aiReason);
   }
   return t;
}

bool CloseTicket(int ticket,string reasonTag)
{
   if(!OrderSelect(ticket,SELECT_BY_TICKET,MODE_TRADES)) return false;
   int type=OrderType();
   if(type!=OP_BUY && type!=OP_SELL) return false;
   bool buy=(type==OP_BUY);
   double price=buy?Bid:Ask;
   double lots=OrderLots();
   bool ok=OrderClose(ticket,lots,price,InpSlippagePoints,g_themeColor);
   if(ok) WisdoWrite("CLOSE",buy?"BUY":"SELL",ticket,lots,price,reasonTag);
   return ok;
}

void CloseAllEAOrders(string reasonTag)
{
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      CloseTicket(OrderTicket(),reasonTag);
   }
}

void CloseAllLaddersOnly(string reasonTag)
{
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      string cm=OrderComment();
      if(IsAnchorComment(cm)) continue;
      CloseTicket(OrderTicket(),reasonTag);
   }
}

//==================================================================//
//========================= ROLLING STATS ===========================//
//==================================================================//
void InitRolling()
{
   g_RollingN=(InpRollingN<5?5:InpRollingN);
   ArrayResize(g_outcomes,g_RollingN);
   for(int i=0;i<g_RollingN;i++) g_outcomes[i]=-1;
   g_outcomeCount=0;
}
void PushOutcome(int win)
{
   for(int i=g_RollingN-1;i>=1;i--) g_outcomes[i]=g_outcomes[i-1];
   g_outcomes[0]=win;
   if(g_outcomeCount<g_RollingN) g_outcomeCount++;
}
double RollingWinRate()
{
   if(g_outcomeCount<=0) return 0;
   int wins=0,cnt=0;
   for(int i=0;i<g_RollingN;i++)
   {
      if(g_outcomes[i]==0 || g_outcomes[i]==1){ cnt++; if(g_outcomes[i]==1) wins++; }
   }
   if(cnt<=0) return 0;
   return 100.0*(double)wins/(double)cnt;
}

//==================================================================//
//=========================== RANK SYSTEM ===========================//
//==================================================================//
void UpdateRank()
{
   if(gRankPoints>=25){ gRank="MYTHIC"; gRankColor=clrMagenta; }
   else if(gRankPoints>=18){ gRank="DIAMOND"; gRankColor=clrAqua; }
   else if(gRankPoints>=12){ gRank="PLATINUM"; gRankColor=clrLime; }
   else if(gRankPoints>=7){ gRank="GOLD"; gRankColor=clrGold; }
   else if(gRankPoints>=3){ gRank="SILVER"; gRankColor=clrSilver; }
   else { gRank="BRONZE"; gRankColor=clrGray; }
   g_themeColor=gRankColor;
}
void UpdateRankPointsOnClose(bool isWin)
{
   double eq=AccountEquity();
   if(!isWin){ gRankPoints=MathMax(0,gRankPoints-1); return; }
   gRankPoints+=1;

   if(gEquityBaseline>0)
   {
      double pctGain=(eq-gEquityBaseline)/gEquityBaseline*100.0;
      if(pctGain>=1.0) gRankPoints+=1;
      if(pctGain>=3.0) gRankPoints+=1;
      if(pctGain>=5.0) gRankPoints+=1;
      if(pctGain>=10.0) gRankPoints+=2;
   }

   if(eq>gLastEquityHigh)
   {
      gRankPoints+=2;
      gLastEquityHigh=eq;
      WisdoWrite("STATE","INFO",0,0,eq,"NEW_EQUITY_HIGH_RANK_BONUS");
   }

   if(gRankPoints>gBestRankPoints) gBestRankPoints=gRankPoints;
}

//==================================================================//
//============================ DAY HL ===============================//
//==================================================================//
datetime DayStartBroker(datetime t)
{
   MqlDateTime dt; TimeToStruct(t,dt);
   dt.hour=6; dt.min=0; dt.sec=0;
   return StructToTime(dt);
}
void UpdateDayHL()
{
   if(!InpShowDayHL) return;
   datetime now=TimeCurrent();
   datetime ds=DayStartBroker(now);

   if(gDayStart==0 || ds!=gDayStart)
   {
      if(gDayStart!=0){ gPrevDayHigh=gDayHigh; gPrevDayLow=gDayLow; }
      gDayStart=ds;
      gDayHigh=High[0];
      gDayLow=Low[0];
      WisdoWrite("STATE","INFO",0,0,0,"NEW_DAY_RESET");
   }
   if(High[0]>gDayHigh) gDayHigh=High[0];
   if(Low[0] <gDayLow ) gDayLow =Low[0];
}
string DayHLTrendText()
{
   if(!InpShowDayHL) return "DayHL: OFF";
   if(gPrevDayHigh==0 && gPrevDayLow==0) return "DayHL: INIT";
   string hiT="=", loT="=";
   if(gPrevDayHigh>0){ if(gDayHigh>gPrevDayHigh) hiT="?"; else if(gDayHigh<gPrevDayHigh) hiT="?"; }
   if(gPrevDayLow>0){  if(gDayLow >gPrevDayLow)  loT="?"; else if(gDayLow <gPrevDayLow)  loT="?"; }
   return "DayHigh "+hiT+" | DayLow "+loT;
}

//==================================================================//
//============================ ZIGZAG TREND =========================//
//==================================================================//
int ZigZagTrend()
{
   int found=0;
   double swings[10]; ArrayInitialize(swings,0);

   int look=InpZZ_LookbackBars;
   if(look<50) look=50;
   if(look>Bars-10) look=Bars-10;

   for(int i=1;i<look && found<10;i++)
   {
      double val=iCustom(Symbol(),0,"ZigZag",InpZZ_Depth,InpZZ_Deviation,InpZZ_Backstep,0,i);
      if(val!=0.0 && val!=EMPTY_VALUE)
      {
         if(found==0 || MathAbs(val-swings[found-1])>(Point*2))
         { swings[found]=val; found++; }
      }
   }
   if(found<InpZZ_MinSwings) return 0;
   if(swings[0]>swings[1]) return +1;
   if(swings[0]<swings[1]) return -1;
   return 0;
}

// ---- V6: HH/HL/LH/LL from ZigZag ----
bool UpdateStructureFromZigZag()
{
   datetime now=TimeCurrent();
   if(g_lastStructUpdate!=0 && now-g_lastStructUpdate<1) { /*ok*/ }

   int look=InpZZ_LookbackBars;
   if(look<120) look=120;
   if(look>Bars-10) look=Bars-10;

   double lastHigh=0, prevHigh=0, lastLow=0, prevLow=0;

   for(int i=1;i<look;i++)
   {
      double val=iCustom(Symbol(),0,"ZigZag",InpZZ_Depth,InpZZ_Deviation,InpZZ_Backstep,0,i);
      if(val==0.0 || val==EMPTY_VALUE) continue;

      double tol=3*Point;
      bool isHigh=(MathAbs(val-High[i])<=tol) || (val>=High[i]-tol);
      bool isLow =(MathAbs(val-Low[i]) <=tol) || (val<=Low[i] +tol);

      if(isHigh)
      {
         if(lastHigh==0) lastHigh=val;
         else if(prevHigh==0)
         {
            if(MathAbs(lastHigh-val) >= InpStructure_MinSwingPoints*Point) prevHigh=val;
         }
      }
      else if(isLow)
      {
         if(lastLow==0) lastLow=val;
         else if(prevLow==0)
         {
            if(MathAbs(lastLow-val) >= InpStructure_MinSwingPoints*Point) prevLow=val;
         }
      }

      if(lastHigh>0 && prevHigh>0 && lastLow>0 && prevLow>0) break;
   }

   if(lastHigh<=0 || prevHigh<=0 || lastLow<=0 || prevLow<=0) return false;

   g_prevHigh=prevHigh; g_lastHigh=lastHigh;
   g_prevLow =prevLow;  g_lastLow =lastLow;

   g_lastHighTag = (g_lastHigh>g_prevHigh ? "HH" : "LH");
   g_lastLowTag  = (g_lastLow >g_prevLow  ? "HL" : "LL");

   g_lastStructUpdate=now;
   return true;
}

bool StructureFlipAgainstCycle()
{
   if(g_cycleDir==-1) return (g_lastHighTag=="HH"); // SELL threatened by HH
   if(g_cycleDir== 1) return (g_lastLowTag =="LL"); // BUY threatened by LL
   return false;
}

//==================================================================//
//======================== FILTERS / SCORE ==========================//
//==================================================================//
bool VolatilityOK()
{
   if(!InpFilter_UseVolatility) return true;
   double atrPts=iATR(Symbol(),InpATR_TF_Vol,InpATR_Period_Vol,0)/Point;
   if(atrPts<=0) return false;
   return (atrPts>=InpATR_MinPoints);
}

bool EMA_TrendFilter(bool wantBuy)
{
   if(!InpFilter_UseEMA) return true;
   int tf=(int)InpEMA_TF;
   int lb=MathMax(InpEMA_SlopeLookbackBars,2);

   double emaNow=iMA(Symbol(),tf,InpEMA_Period,0,MODE_EMA,PRICE_CLOSE,0);
   double emaPrev=iMA(Symbol(),tf,InpEMA_Period,0,MODE_EMA,PRICE_CLOSE,lb);
   double slopePts=(emaNow-emaPrev)/Point;

   if(wantBuy)
   {
      if(Close[0] < emaNow) return false;
      if(slopePts < InpEMA_MinSlopePoints) return false;
   }
   else
   {
      if(Close[0] > emaNow) return false;
      if(slopePts > -InpEMA_MinSlopePoints) return false;
   }
   return true;
}

double CalculateTrendScore(bool wantBuy)
{
   double score=0;
   int tf=(int)InpEMA_TF;
   int lb=MathMax(InpEMA_SlopeLookbackBars,2);

   double emaNow=iMA(Symbol(),tf,InpEMA_Period,0,MODE_EMA,PRICE_CLOSE,0);
   double emaPrev=iMA(Symbol(),tf,InpEMA_Period,0,MODE_EMA,PRICE_CLOSE,lb);
   double slope=(emaNow-emaPrev)/Point;

   double slopeStrength=MathMin(MathAbs(slope)/50.0*30.0,30.0);
   score+=slopeStrength;

   double dist=MathAbs(Close[0]-emaNow)/Point;
   double distScore=MathMin(dist/100.0*20.0,20.0);
   score+=distScore;

   int zz=ZigZagTrend();
   if((zz==1 && wantBuy) || (zz==-1 && !wantBuy)) score+=25;

   double body=MathAbs(Close[1]-Open[1])/Point;
   double momentumScore=MathMin(body/80.0*25.0,25.0);
   score+=momentumScore;

   if(score>100) score=100;
   return score;
}

//==================================================================//
//==================== WYCKOFF EXPANSION GATE =======================//
//==================================================================//
bool IsExpansionCandle(bool &buyOut)
{
   double spr=MarketInfo(Symbol(),MODE_SPREAD);
   if(spr>InpMaxSpreadPoints_EntryBlock) return false;

   double atr=ATR(InpATR_Period_Expansion,1);
   if(atr<=0) return false;

   double r1=Range(1);
   if(r1<=0) return false;
   if(r1 < atr*InpExpansionRange_ATR_Min) return false;

   int N=InpExpansionLookback_Strict;
   if(N<2) N=2;

   double maxR=0;
   for(int i=2;i<=N && i<Bars;i++)
      if(Range(i)>maxR) maxR=Range(i);

   if(r1<=maxR) return false;
   if(Close[1]==Open[1]) return false;

   buyOut=(Close[1]>Open[1]);
   g_lastExpansionTime=TimeCurrent();
   return true;
}

//==================================================================//
//==================== EQUITY GOVERNOR + DAILY IDLE =================//
//==================================================================//
void ResetEquityBaseline()
{
   gEquityBaseline=AccountEquity();
   if(gEquityBaseline<=0) gEquityBaseline=AccountBalance();
   WisdoWrite("STATE","INFO",0,0,gEquityBaseline,"EQUITY_BASELINE_RESET");
}

bool EquityThresholdReached()
{
   if(!InpGov_Enable) return false;
   if(InpGov_GainTriggerPct<=0) return false;
   if(gEquityBaseline<=0) return false;
   double gain=AccountEquity()-gEquityBaseline;
   double need=gEquityBaseline*(InpGov_GainTriggerPct/100.0);
   return (gain>=need);
}

void DailyIdle_ResetIfNewDay()
{
   datetime ds=DayStartBroker(TimeCurrent());
   if(gGovDayStart==0) gGovDayStart=ds;

   if(ds!=gGovDayStart)
   {
      gGovDayStart=ds;
      gGovTriggersToday=0;
      gDailyIdle=false;
      WisdoWrite("STATE","INFO",0,0,0,"NEW_DAY_GOV_RESET_IDLE_OFF");
   }
}

void CheckGovernorAndDailyIdle()
{
   DailyIdle_ResetIfNewDay();

   if(gDailyIdle)
   {
      if(CountOpenByMagic()>0) CloseAllEAOrders("DAILY_IDLE_FORCE_FLAT");
      return;
   }

   if(CooldownActive())
   {
      if(CountOpenByMagic()>0) CloseAllEAOrders("COOLDOWN_FORCE_FLAT");
      return;
   }

   if(gGovernorLocked) return;
   if(!EquityThresholdReached()) return;

   gGovernorLocked=true;
   gGovTriggersToday++;

   g_LastDecisionReason="GOVERNOR TRIGGER: equity target hit -> FORCE FLAT + cooldown";
   g_LastWaitReason="WAIT: Governor cooldown (target hit)";

   CloseAllEAOrders("EQUITY_GOVERNOR_FORCE_CLOSE");
   StartCooldownMinutes(MathMax(InpGov_CooldownMinutes,1),"EQUITY_TARGET_COOLDOWN");

   WisdoWrite("STATE","INFO",0,0,AccountEquity(),"GOV_TRIGGERED_"+IntegerToString(gGovTriggersToday));

   if(gGovTriggersToday>=MathMax(InpGov_MaxTriggersPerDay,1))
   {
      gDailyIdle=true;
      StartCooldownMinutes(0,"");
      g_LastDecisionReason="DAILY IDLE: max governor triggers reached -> idle until 00:00";
      g_LastWaitReason="WAIT: DAILY IDLE (resets at 00:00)";
      WisdoWrite("STATE","INFO",0,0,AccountEquity(),"DAILY_IDLE_ON_MAX_TRIGGERS");
   }
}

void CheckCooldownRelease()
{
   if(!CooldownActive() && g_cdUntil!=0)
   {
      g_cdUntil=0; g_cdReason="";
      ResetEquityBaseline();
      gGovernorLocked=false;
      g_LastDecisionReason="COOLDOWN ENDED: baseline reset + trading unlocked";
      g_LastWaitReason="WAIT: Searching for entry";
      WisdoWrite("STATE","INFO",0,0,AccountEquity(),"COOLDOWN_ENDED");
   }
}

//==================================================================//
//==================== CAPITAL TRAIL (AUTHORITATIVE) =================//
//==================================================================//
double CapitalTrail_EquityFloor()
{
   if(!InpCapitalTrail_Enable) return -1;

   double protect=MathMax(0.0,MathMin(InpCapitalTrail_ProtectPct,100.0))/100.0;
   double floor1=gAnchorEquity + (gPeakEquity-gAnchorEquity)*protect;

   double dd=MathMax(0.0,MathMin(InpCapitalTrail_MaxDDPct,100.0))/100.0;
   double floor2=gPeakEquity*(1.0-dd);

   return MathMax(floor1,floor2);
}

void CapitalTrail_UpdateAndProtect()
{
   if(!InpCapitalTrail_Enable) return;
   if(g_cycleDir==0) return;

   double eq=AccountEquity();

   double activationGain=gAnchorEquity*(InpCapitalTrail_ActivationPct/100.0);
   if(eq < gAnchorEquity + activationGain) return;

   if(eq>gPeakEquity) gPeakEquity=eq;

   double floor=CapitalTrail_EquityFloor();
   if(floor<=0) return;

   if(eq<=floor)
   {
      g_LastDecisionReason="CAPITAL TRAIL EXIT: equity hit protected floor -> CLOSE ALL";
      g_LastWaitReason="WAIT: Capital protected. Resetting cycle.";

      CloseAllEAOrders("CAPITAL_TRAIL_EXIT");
      WisdoWrite("STATE","INFO",0,0,eq,"CAPITAL_TRAIL_EXIT");

      // Reset campaign
      g_cycleDir=0; g_anchorPrice=0; g_baseLot=0;
      g_primaryAdds=0; g_drawdownAdds=0;
      gAnchorEquity=0; gPeakEquity=0;

      // Reset ladder state
      g_lastAddRefPrice=0; g_ladderLocked=false; g_reclaimLine=0;
      g_pullbackMaxAgainstPts=0; g_lastFavorablePeakPts=0;
   }
}

//==================================================================//
//==================== BUILD STATIONS (H1 BOS) ======================//
//==================================================================//
double H1High(int shift){ return iHigh(Symbol(),PERIOD_H1,shift); }
double H1Low(int shift){  return iLow(Symbol(), PERIOD_H1,shift); }
double H1Close(int shift){return iClose(Symbol(),PERIOD_H1,shift); }
datetime H1Time(int shift){return iTime(Symbol(),PERIOD_H1,shift); }

bool IsH1PivotHigh(int idx,int r)
{
   double h=H1High(idx);
   if(h<=0) return false;
   for(int k=1;k<=r;k++)
      if(H1High(idx-k)>=h || H1High(idx+k)>h) return false;
   return true;
}
bool IsH1PivotLow(int idx,int r)
{
   double l=H1Low(idx);
   if(l<=0) return false;
   for(int k=1;k<=r;k++)
      if(H1Low(idx-k)<=l || H1Low(idx+k)<l) return false;
   return true;
}

void UpdateLastH1Pivots()
{
   int r=MathMax(2,InpStation_H1PivotRadius);
   int maxScan=MathMax(60,InpStation_H1ScanBars);

   double bestHigh=0; datetime bestHighT=0;
   double bestLow=0;  datetime bestLowT=0;

   for(int i=r+1;i<maxScan;i++)
   {
      if(bestHighT==0 && IsH1PivotHigh(i,r))
      { bestHigh=H1High(i); bestHighT=H1Time(i); }
      if(bestLowT==0 && IsH1PivotLow(i,r))
      { bestLow=H1Low(i); bestLowT=H1Time(i); }
      if(bestHighT!=0 && bestLowT!=0) break;
   }

   if(bestHighT!=0){ gLastPivotHigh=bestHigh; gLastPivotHighTime=bestHighT; }
   if(bestLowT!=0){  gLastPivotLow =bestLow;  gLastPivotLowTime =bestLowT;  }
}

bool NewH1BarClosed()
{
   datetime t=H1Time(0);
   if(t==0) return false;
   if(t!=gLastH1BarTime){ gLastH1BarTime=t; return true; }
   return false;
}

bool DetectH1BOS(int campaignDir,bool &bosUp,double &bosPrice,datetime &bosTime)
{
   bosUp=false; bosPrice=0; bosTime=0;
   if(!InpStation_Enable) return false;
   if(campaignDir==0) return false;

   UpdateLastH1Pivots();
   double c1=H1Close(1);
   datetime t1=H1Time(1);

   if(campaignDir==1)
   {
      if(gLastPivotHigh>0 && c1>gLastPivotHigh)
      { bosUp=true; bosPrice=gLastPivotHigh; bosTime=t1; return true; }
   }
   else if(campaignDir==-1)
   {
      if(gLastPivotLow>0 && c1<gLastPivotLow)
      { bosUp=false; bosPrice=gLastPivotLow; bosTime=t1; return true; }
   }
   return false;
}

void DeleteStationObjects(int idx)
{
   string p="DF_ST_"+IntegerToString(idx)+"_";
   ObjectDelete(0,p+"BOSV"); ObjectDelete(0,p+"PEAKH"); ObjectDelete(0,p+"IMP");
   ObjectDelete(0,p+"LBL");  ObjectDelete(0,p+"PEAK");
}
void ShiftStationsLeft()
{
   DeleteStationObjects(0);
   for(int i=0;i<2;i++) gStations[i]=gStations[i+1];
   gStations[2].bosTime=0; gStations[2].bosPrice=0;
   gStations[2].peakTime=0; gStations[2].peakPrice=0;
   gStations[2].expansionPoints=0; gStations[2].dir=0;
   gStationCount=MathMax(0,gStationCount-1);
   if(gActiveStation>=0) gActiveStation=MathMax(0,gActiveStation-1);
}
void ClearStationsNow()
{
   for(int i=0;i<3;i++) DeleteStationObjects(i);
   gStationCount=0; gActiveStation=-1;
   gLastPivotHigh=0; gLastPivotLow=0;
   gLastPivotHighTime=0; gLastPivotLowTime=0;
   gFreezeAdds=false;
   gLastPrimaryRef=0;
}

void AddNewStation(int dir,datetime bosTime,double bosPrice)
{
   if(gStationCount>=3) ShiftStationsLeft();
   int idx=gStationCount;
   gStations[idx].dir=dir;
   gStations[idx].bosTime=bosTime;
   gStations[idx].bosPrice=bosPrice;
   gStations[idx].peakTime=bosTime;
   gStations[idx].peakPrice=bosPrice;
   gStations[idx].expansionPoints=0;
   gStationCount++;
   gActiveStation=idx;

   gFreezeAdds=false;
   gLastPrimaryRef=0;
   WisdoWrite("STATE","INFO",0,0,bosPrice,"NEW_BUILD_STATION_H1_BOS");
}

void UpdateActiveStationPeak()
{
   if(gActiveStation<0 || gActiveStation>=gStationCount) return;
   if(g_cycleDir==0) return;

   int idx=gActiveStation;
   int dir=gStations[idx].dir;
   if(dir==0) return;

   double h0=H1High(0), l0=H1Low(0);
   datetime t0=H1Time(0);

   if(dir==1)
   {
      if(h0>gStations[idx].peakPrice)
      { gStations[idx].peakPrice=h0; gStations[idx].peakTime=t0; }
   }
   else
   {
      if(l0<gStations[idx].peakPrice || gStations[idx].peakPrice==0)
      { gStations[idx].peakPrice=l0; gStations[idx].peakTime=t0; }
   }
   gStations[idx].expansionPoints=MathAbs(gStations[idx].peakPrice-gStations[idx].bosPrice)/Point;
}

double PrimaryRefPrice()
{
   // V5.2 behavior: prefer station peak when available
   if(gActiveStation>=0 && gActiveStation<gStationCount)
   {
      double p=gStations[gActiveStation].peakPrice;
      if(p>0) return p;
   }
   return g_anchorPrice;
}

bool RefChangedRecently()
{
   double ref=PrimaryRefPrice();
   if(ref<=0) return false;
   if(gLastPrimaryRef==0){ gLastPrimaryRef=ref; return true; }
   if(MathAbs(ref-gLastPrimaryRef)>(Point*5))
   { gLastPrimaryRef=ref; return true; }
   return false;
}

bool AddThrottleOK()
{
   if(InpMinSecondsBetweenAdds<=0) return true;
   if(gLastAddTime==0) return true;
   return ((TimeCurrent()-gLastAddTime) >= InpMinSecondsBetweenAdds);
}

//==================================================================//
//==================== V6 PROFIT TRIGGER -> RISK FREE ===============//
//==================================================================//
double FloatingProfitEA()
{
   double p=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
      if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES))
         if(OrderMagicNumber()==InpMagicNumber_ForThisEA && OrderSymbol()==Symbol())
            p += (OrderProfit()+OrderSwap()+OrderCommission());
   return p;
}

double FloatingProfitAnchorOnly()
{
   double p=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      if(!IsAnchorComment(OrderComment())) continue;
      p += (OrderProfit()+OrderSwap()+OrderCommission());
   }
   return p;
}

bool ProfitTriggerReached()
{
   if(g_baseLot<=0) return false;
   double profit = (InpUseBasketProfit ? FloatingProfitEA() : FloatingProfitAnchorOnly());
   double triggerMoney = PipMoneyPerLot() * g_baseLot * InpProfitTriggerPips;
   return (profit >= triggerMoney);
}

void MoveAnchorSLToBE()
{
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      if(!IsAnchorComment(OrderComment())) continue;

      int type=OrderType();
      if(type!=OP_BUY && type!=OP_SELL) continue;

      double entry=OrderOpenPrice();
      double sl=OrderStopLoss();

      if(type==OP_BUY)
      {
         if(sl<=0 || sl < entry - 1*Point)
         {
            if(OrderModify(OrderTicket(),entry,entry,0,0,clrAqua))
               WisdoWrite("STATE","INFO",OrderTicket(),OrderLots(),entry,"ANCHOR_SL_TO_BE");
         }
      }
      else
      {
         if(sl<=0 || sl > entry + 1*Point)
         {
            if(OrderModify(OrderTicket(),entry,entry,0,0,clrAqua))
               WisdoWrite("STATE","INFO",OrderTicket(),OrderLots(),entry,"ANCHOR_SL_TO_BE");
         }
      }
   }
}

//==================================================================//
//==================== V6: STRUCTURE FLIP => TIGHTEN SL (C) =========//
//==================================================================//
void TightenAnchorSL_OnStructureFlip()
{
   if(g_cycleDir==0) return;
   if(!StructureFlipAgainstCycle()) return;

   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      if(!IsAnchorComment(OrderComment())) continue;

      int type=OrderType();
      if(type!=OP_BUY && type!=OP_SELL) continue;

      double curSL=OrderStopLoss();
      double newSL=curSL;

      if(type==OP_SELL)
      {
         newSL = g_lastHigh + InpAnchorTightenBufferPts*Point;
         if(curSL<=0 || newSL < curSL)
         {
            if(OrderModify(OrderTicket(),OrderOpenPrice(),newSL,0,0,clrAqua))
               WisdoWrite("STATE","INFO",OrderTicket(),OrderLots(),newSL,"ANCHOR_SL_TIGHTEN_HH_THREAT");
         }
      }
      else
      {
         newSL = g_lastLow - InpAnchorTightenBufferPts*Point;
         if(curSL<=0 || newSL > curSL)
         {
            if(OrderModify(OrderTicket(),OrderOpenPrice(),newSL,0,0,clrAqua))
               WisdoWrite("STATE","INFO",OrderTicket(),OrderLots(),newSL,"ANCHOR_SL_TIGHTEN_LL_THREAT");
         }
      }
   }
}

//==================================================================//
//==================== V6: LADDER DD CAP (A + D) ====================//
//==================================================================//
double LargestWinTodayMoney()
{
   datetime ds=DayStartBroker(TimeCurrent());
   double best=0;
   int total=OrdersHistoryTotal();
   for(int i=total-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_HISTORY)) continue;
      if(OrderSymbol()!=Symbol() || OrderMagicNumber()!=InpMagicNumber_ForThisEA) continue;
      if(OrderCloseTime() < ds) continue;
      double prof=OrderProfit()+OrderSwap()+OrderCommission();
      if(prof>best) best=prof;
   }
   if(best<=0) best=MathMax(InpLargestWinFallbackMoney,0.0);
   return best;
}

double FloatingProfitNonAnchor()
{
   double p=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      if(IsAnchorComment(OrderComment())) continue;
      p += (OrderProfit()+OrderSwap()+OrderCommission());
   }
   return p;
}

bool LadderDDCapHit()
{
   double best=LargestWinTodayMoney();
   double cap=best*InpLadderDDCapFraction;
   if(cap<=0) return false;
   double p=FloatingProfitNonAnchor();
   return (p <= -cap);
}

double ReclaimBuffer()
{
   double spr=MarketInfo(Symbol(),MODE_SPREAD);
   return MathMax((spr+5)*Point, 10*Point);
}

void LadderLock_SetReclaimLine()
{
   // D) unlock immediately on reclaim:
   // BUY: reclaim above last swing high
   // SELL: reclaim below last swing low
   if(g_cycleDir==1)  g_reclaimLine=g_lastHigh;
   if(g_cycleDir==-1) g_reclaimLine=g_lastLow;
   if(g_reclaimLine<=0) g_reclaimLine=g_anchorPrice;
}

bool ReclaimConfirmed()
{
   if(!g_ladderLocked) return false;
   if(g_reclaimLine<=0) return false;
   double buf=ReclaimBuffer();
   if(g_cycleDir==1)  return (Close[1] > g_reclaimLine + buf);
   if(g_cycleDir==-1) return (Close[1] < g_reclaimLine - buf);
   return false;
}

void CheckLadderDDCapAndLock()
{
   if(g_cycleDir==0) return;
   if(LadderDDCapHit())
   {
      CloseAllLaddersOnly("LADDER_DD_CAP_WIPE_KEEP_ANCHOR");
      g_ladderLocked=true;
      LadderLock_SetReclaimLine();

      // reset wave
      g_primaryAdds=0;
      g_lastAddRefPrice = PrimaryRefPrice();
      g_pullbackMaxAgainstPts=0;
      g_lastFavorablePeakPts=0;

      WisdoWrite("STATE","INFO",0,0,g_reclaimLine,"LADDER_LOCKED_AFTER_WIPE_RECLAIM_LINE_SET");
      g_LastDecisionReason="LADDER WIPE: DD cap hit -> close NON-ANCHOR, lock until reclaim";
   }
}

void CheckLadderUnlockOnReclaim()
{
   if(!g_ladderLocked) return;
   if(ReclaimConfirmed())
   {
      g_ladderLocked=false;
      g_primaryAdds=0;
      g_lastAddRefPrice=(g_cycleDir==1?Bid:Ask);
      g_pullbackMaxAgainstPts=0;
      g_lastFavorablePeakPts=0;

      WisdoWrite("STATE","INFO",0,0,g_reclaimLine,"LADDER_UNLOCK_RECLAIM_CONFIRMED");
      g_LastDecisionReason="LADDER UNLOCK: reclaim confirmed -> ladder resumes";
      g_LastWaitReason="";
   }
}

//==================================================================//
//==================== DRAWNDOWN LADDER (SAME DIR) ==================//
//==================================================================//
bool OppositeExpansionJustHappened()
{
   bool expBuy=false;
   if(!IsExpansionCandle(expBuy)) return false;
   if(g_cycleDir==1 && expBuy==false) return true;
   if(g_cycleDir==-1 && expBuy==true) return true;
   return false;
}

bool DrawdownAddReady()
{
   if(g_cycleDir==1)
   {
      double dd=(g_anchorPrice-Ask)/Point;
      return (dd >= InpDD_SpacingPoints*(g_drawdownAdds+1));
   }
   if(g_cycleDir==-1)
   {
      double dd=(Bid-g_anchorPrice)/Point;
      return (dd >= InpDD_SpacingPoints*(g_drawdownAdds+1));
   }
   return false;
}

double BuildDrawdownLot()
{
   double lot=g_baseLot*MathMax(0.01,InpDD_LotFactorOfBase);
   return NormalizeLot(lot);
}

//==================================================================//
//==================== V6 FLOW LADDER (Primary extractor) ===========//
//==================================================================//
double LadderDistancePts(int level)
{
   if(level<1) level=1;
   if(InpFlowSpacingMode==LADDER_ARITH) return (double)InpFlow_LadderStepPoints*(double)level;
   return (double)InpFlow_LadderStepPoints*MathPow(InpFlow_GeoMultiplier,(level-1));
}

double MoveFromRefPts()
{
   double ref = g_lastAddRefPrice;
   if(ref<=0) ref = PrimaryRefPrice();
   if(ref<=0) return 0;

   if(g_cycleDir==1)  return (Bid-ref)/Point;
   if(g_cycleDir==-1) return (ref-Ask)/Point;
   return 0;
}

void UpdateContinuationTrackers()
{
   double ref = PrimaryRefPrice();
   if(ref<=0) ref=g_anchorPrice;

   double favPts=0;
   if(g_cycleDir==1) favPts=(Bid-ref)/Point;
   if(g_cycleDir==-1) favPts=(ref-Ask)/Point;

   if(favPts>g_lastFavorablePeakPts) g_lastFavorablePeakPts=favPts;

   double pullback = g_lastFavorablePeakPts - favPts;
   if(pullback > g_pullbackMaxAgainstPts) g_pullbackMaxAgainstPts=pullback;

   if(g_cycleDir==0)
   { g_lastFavorablePeakPts=0; g_pullbackMaxAgainstPts=0; }
}

bool ExpansionAddReady(bool buy)
{
   if(!InpUseExpansionAdd) return false;
   double atr=ATR(InpATR_Period_Expansion,1);
   if(atr<=0) return false;
   double r=Range(1);
   if(r < atr*InpLadderExpATRMult) return false;
   bool dir=(Close[1]>Open[1]);
   if(buy && !dir) return false;
   if(!buy && dir) return false;
   return true;
}

bool ContinuationAddReady(bool buy)
{
   if(!InpUseContinuationAdd) return false;
   if(g_pullbackMaxAgainstPts < InpPullbackMinPoints) return false;

   double buf=ReclaimBuffer();
   if(buy)  return (Close[1] > High[2] + buf);
   else     return (Close[1] < Low[2]  - buf);
}

bool RiskFreeAddReady(){ return InpUseRiskFreeAdd && ProfitTriggerReached(); }

bool StructureBreakReady(bool buy)
{
   if(!InpUseStructureBreakAdd) return false;
   double buf=ReclaimBuffer();
   if(buy)  return (g_lastHigh>0 && Close[1] > g_lastHigh + buf);
   else     return (g_lastLow>0  && Close[1] < g_lastLow  - buf);
}

double BuildFlowLot()
{
   double lot=0;
   if(InpFlowLotScaling==LOT_FIXED) lot=NormalizeLot(g_baseLot);
   else if(InpFlowLotScaling==LOT_GEO) lot=NormalizeLot(g_baseLot*MathPow(InpFlowLotMultiplier,g_primaryAdds));
   else if(InpFlowLotScaling==LOT_ARITH) lot=NormalizeLot(g_baseLot + (InpFlowLotIncrement*g_primaryAdds));
   else lot=NormalizeLot(g_baseLot);

   return lot;
}

void TryFlowLadderAdd()
{
   if(g_cycleDir==0) return;
   if(gDailyIdle || CooldownActive()) return;
   if(g_ladderLocked) return;
   if(!AddThrottleOK()) return;

   int maxL=MathMin(100,MathMax(0,InpFlow_MaxAdds_UserSet));
   if(g_primaryAdds >= maxL) return;

   if(CountOpenPrimary() >= gMaxPrimaryOrders) return;

   // If station peak just moved, don't instantly fire
   if(RefChangedRecently()) return;

   bool buy=(g_cycleDir==1);

   // Protect anchor once risk-free trigger hit
   if(ProfitTriggerReached()) MoveAnchorSLToBE();

   UpdateContinuationTrackers();

   bool trigExp = ExpansionAddReady(buy);
   bool trigCont= ContinuationAddReady(buy);
   bool trigRF  = RiskFreeAddReady();
   bool trigSB  = StructureBreakReady(buy);

   bool flowOK = (trigExp || trigCont || trigRF || trigSB);
   if(!flowOK) return;

   // StructureBreak acts as "second anchor / wave reset"
   if(trigSB)
   {
      g_primaryAdds=0;
      g_lastAddRefPrice = PrimaryRefPrice();
      g_pullbackMaxAgainstPts=0;
      g_lastFavorablePeakPts=0;
      WisdoWrite("STATE","INFO",0,0,Close[1],"STRUCTURE_BREAK_WAVE_RESET_SECOND_ANCHOR");
   }

   int nextLevel=g_primaryAdds+1;
   double needPts=LadderDistancePts(nextLevel);
   if(MoveFromRefPts() < needPts) return;

   double sl=BuildATR_SL(buy);
   double lot=BuildFlowLot();
   if(lot<=0) return;

   int t=OpenOrder(lot,buy,sl,"LADDER_FLOW");
   if(t>0)
   {
      g_primaryAdds++;
      gLastAddTime=TimeCurrent();

      // collector ref updates to current price (so we keep "collect per distance")
      g_lastAddRefPrice = (buy ? Bid : Ask);

      g_pullbackMaxAgainstPts=0;
      g_lastFavorablePeakPts=0;

      string why="FLOW";
      if(trigSB) why="STRUCT_BREAK";
      else if(trigCont) why="CONT_RECLAIM";
      else if(trigExp) why="EXPANSION";
      else if(trigRF) why="RISK_FREE";

      g_LastDecisionReason="FLOW LADDER ADD L"+IntegerToString(g_primaryAdds)+" ["+why+"] needPts="+DoubleToString(needPts,0);
      g_LastWaitReason="";
   }
}

//==================================================================//
//============================ EXIT MGMT (FIX) ======================//
//==================================================================//
double OrderRiskMoney()
{
   double sl=OrderStopLoss();
   if(sl<=0) return 0;
   double ep=OrderOpenPrice();
   double distPoints=MathAbs(ep-sl)/Point;
   if(distPoints<=1) return 0;
   return distPoints*PipValue()*OrderLots();
}

// StepProfit: close ladders/DD by default; keep anchor open unless enabled
void ManageOpenTrades_StepProfit()
{
   if(InpExit_StepProfitEnable!=1) return;
   if(InpExit_ProfitStepPrice<=0) return;

   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;

      int type=OrderType();
      if(type!=OP_BUY && type!=OP_SELL) continue;

      string cm=OrderComment();
      if(IsAnchorComment(cm) && !InpExit_ApplyToAnchorToo) continue;

      double entry=OrderOpenPrice();
      int ticket=OrderTicket();

      if(type==OP_BUY)
      {
         if(Bid >= entry + InpExit_ProfitStepPrice)
            CloseTicket(ticket,"STEP_PROFIT");
      }
      else
      {
         if(Ask <= entry - InpExit_ProfitStepPrice)
            CloseTicket(ticket,"STEP_PROFIT");
      }
   }
}

// SuperScalp RR: close ladders/DD by default; keep anchor open unless enabled
void ManageOpenTrades_SuperScalp()
{
   if(InpExit_SuperScalpEnable!=1) return;

   double wr=RollingWinRate();
   double rr=(wr>=InpExit_SuperScalp_WRBoost ? InpExit_SuperScalp_RR_High : InpExit_SuperScalp_RR_Base);
   if(rr<0.5) rr=0.5;

   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;

      int type=OrderType();
      if(type!=OP_BUY && type!=OP_SELL) continue;

      string cm=OrderComment();
      if(IsAnchorComment(cm) && !InpExit_ApplyToAnchorToo) continue;

      double risk=OrderRiskMoney();
      if(risk<=0) continue;

      double target=risk*rr;
      double prof=OrderProfit()+OrderSwap()+OrderCommission();

      if(prof >= target)
         CloseTicket(OrderTicket(),"SUPER_SCALP_RR");
   }
}

//==================================================================//
//===================== GOD CLOCK (NY TIME) =========================//
//==================================================================//
datetime SecondSundayOfMarch(int year)
{
   MqlDateTime dt; dt.year=year; dt.mon=3; dt.day=1; dt.hour=2; dt.min=0; dt.sec=0;
   datetime t=StructToTime(dt);
   int dow=TimeDayOfWeek(t);
   int add=(7-dow)%7;
   int firstSunday=1+add;
   dt.day=firstSunday+7;
   return StructToTime(dt);
}
datetime FirstSundayOfNovember(int year)
{
   MqlDateTime dt; dt.year=year; dt.mon=11; dt.day=1; dt.hour=2; dt.min=0; dt.sec=0;
   datetime t=StructToTime(dt);
   int dow=TimeDayOfWeek(t);
   int add=(7-dow)%7;
   dt.day=1+add;
   return StructToTime(dt);
}
bool IsUSDST_GMT(datetime gmt)
{
   MqlDateTime d; TimeToStruct(gmt,d);
   int y=d.year;
   datetime dstStartLocal=SecondSundayOfMarch(y);
   datetime dstEndLocal=FirstSundayOfNovember(y);
   datetime dstStartGMT=dstStartLocal + 5*3600;
   datetime dstEndGMT  =dstEndLocal   + 4*3600;
   return (gmt>=dstStartGMT && gmt<dstEndGMT);
}
datetime NewYorkTime()
{
   datetime gmt=TimeGMT();
   int offset=IsUSDST_GMT(gmt)?-4:-5;
   return gmt + offset*3600;
}
string SessionTagNY(datetime ny)
{
   MqlDateTime d; TimeToStruct(ny,d);
   int h=d.hour;
   if(h>=20 || h<=2) return "ASIA";
   if(h>=3 && h<=7)  return "LONDON";
   if(h>=8 && h<=16) return "NEW YORK";
   if(h>=17 && h<=19) return "POWER HOUR";
   return "OFF";
}
string FormatTimeShort(datetime t)
{
   MqlDateTime d; TimeToStruct(t,d);
   return StringFormat("%02d:%02d:%02d",d.hour,d.min,d.sec);
}
string SinceText(datetime past)
{
   if(past<=0) return "N/A";
   int s=(int)(TimeCurrent()-past); if(s<0) s=0;
   int h=s/3600; s%=3600;
   int m=s/60; int sec=s%60;
   if(h>0) return IntegerToString(h)+"h "+IntegerToString(m)+"m";
   if(m>0) return IntegerToString(m)+"m "+IntegerToString(sec)+"s";
   return IntegerToString(sec)+"s";
}

//==================================================================//
//===================== CHART THEME (CANDLE COLORS) =================//
//==================================================================//
void ApplyRankCandleColors()
{
   ChartSetInteger(0,CHART_COLOR_CANDLE_BULL,gRankColor);
   ChartSetInteger(0,CHART_COLOR_CANDLE_BEAR,gRankColor);
   ChartSetInteger(0,CHART_COLOR_CHART_UP,gRankColor);
   ChartSetInteger(0,CHART_COLOR_CHART_DOWN,gRankColor);
}

//==================================================================//
//============================ DASHBOARD ============================//
//==================================================================//
void EnsureRectLabel(string name,int x,int y,int w,int h,color bg,int z)
{
   if(ObjectFind(0,name)<0) ObjectCreate(0,name,OBJ_RECTANGLE_LABEL,0,0,0);
   ObjectSetInteger(0,name,OBJPROP_CORNER,InpDashCorner);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,name,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,name,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,name,OBJPROP_BGCOLOR,bg);
   ObjectSetInteger(0,name,OBJPROP_COLOR,bg);
   ObjectSetInteger(0,name,OBJPROP_BACK,false);
   ObjectSetInteger(0,name,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,name,OBJPROP_HIDDEN,true);
   ObjectSetInteger(0,name,OBJPROP_ZORDER,z);
}
void EnsureLabel(string name,int x,int y,string text,int size,color c,int z)
{
   if(ObjectFind(0,name)<0) ObjectCreate(0,name,OBJ_LABEL,0,0,0);
   ObjectSetInteger(0,name,OBJPROP_CORNER,InpDashCorner);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,name,OBJPROP_FONTSIZE,size);
   ObjectSetInteger(0,name,OBJPROP_COLOR,c);
   ObjectSetInteger(0,name,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,name,OBJPROP_HIDDEN,true);
   ObjectSetInteger(0,name,OBJPROP_ZORDER,z);
   ObjectSetString(0,name,OBJPROP_FONT,"Consolas");
   ObjectSetString(0,name,OBJPROP_TEXT,text);
}
string CheckMark(bool ok){ return ok ? "?" : "?"; }

void DrawDashboardV61(string actionLine)
{
   if(!InpShowDashboard) return;

   int x=InpDashX, y=InpDashY;
   int W=660, H=320;

   EnsureRectLabel("DF61_PANEL",x,y,W,H,clrBlack,200);
   EnsureRectLabel("DF61_STRIP",x,y,W,18,gRankColor,201);

   datetime ny=NewYorkTime();
   string session=SessionTagNY(ny);

   EnsureLabel("DF61_HEAD",x+8,y+2,"DF WISDO ENGINE V6.1 | GOD CLOCK NY "+FormatTimeShort(ny)+" ("+session+")",10,clrBlack,204);

   int trend=ZigZagTrend();
   bool wantBuy=(trend==1);
   string trendTxt=(trend==1?"UP (BUY)":(trend==-1?"DOWN (SELL)":"UNKNOWN"));

   double wr=RollingWinRate();

   string pools="Orders: Primary "+IntegerToString(CountOpenPrimary())+"/"+IntegerToString(gMaxPrimaryOrders)+
                " | Drawdown "+IntegerToString(CountOpenDrawdown())+"/"+IntegerToString(gMaxDrawdownOrders)+
                " | Total "+IntegerToString(CountOpenByMagic())+"/"+IntegerToString(InpMaxOrdersTotal_UserSets);

   EnsureLabel("DF61_RANK",x+10,y+26,"Rank: "+gRank+"  PTS "+IntegerToString(gRankPoints)+"  BEST "+IntegerToString(gBestRankPoints),10,clrWhite,205);
   EnsureLabel("DF61_STATE1",x+10,y+44,"Trend: "+trendTxt+" | "+DayHLTrendText(),9,clrWhite,205);
   EnsureLabel("DF61_STATE2",x+10,y+60,"WR("+IntegerToString(g_RollingN)+")="+DoubleToString(wr,1)+"% | "+pools,9,clrWhite,205);
   EnsureLabel("DF61_STATE3",x+10,y+76,"Last Trade: "+SinceText(g_lastTradeTime)+" | Last Expansion: "+SinceText(g_lastExpansionTime),9,clrWhite,205);

   string govLine="Gov Triggers Today: "+IntegerToString(gGovTriggersToday)+"/"+IntegerToString(MathMax(InpGov_MaxTriggersPerDay,1))+
                  " | DailyIdle="+(gDailyIdle?"YES":"NO")+" | "+CooldownTextFull();
   EnsureLabel("DF61_GOV",x+10,y+92,govLine,9,clrWhite,205);

   double floor=CapitalTrail_EquityFloor();
   string capLine="CapitalTrail: Peak="+DoubleToString(gPeakEquity,2)+" | AnchorEq="+DoubleToString(gAnchorEquity,2)+
                  " | Floor="+(floor>0?DoubleToString(floor,2):"OFF");
   EnsureLabel("DF61_CAP",x+10,y+108,capLine,9,clrWhite,205);

   string structLine="Structure: High="+g_lastHighTag+" "+DoubleToString(g_lastHigh,Digits)+
                     " | Low="+g_lastLowTag+" "+DoubleToString(g_lastLow,Digits)+
                     " | FlipThreat="+(StructureFlipAgainstCycle()?"YES":"NO");
   EnsureLabel("DF61_STRUCT",x+10,y+124,structLine,9,clrWhite,205);

   string ladderLine="FlowLadder: Adds="+IntegerToString(g_primaryAdds)+"/"+IntegerToString(InpFlow_MaxAdds_UserSet)+
                     " | Locked="+(g_ladderLocked?"YES":"NO")+
                     " | ReclaimLine="+DoubleToString(g_reclaimLine,Digits)+
                     " | NonAnchorFloat="+DoubleToString(FloatingProfitNonAnchor(),2)+
                     " | LargestWinToday="+DoubleToString(LargestWinTodayMoney(),2);
   EnsureLabel("DF61_LAD",x+10,y+140,ladderLine,9,clrWhite,205);

   bool volOK=VolatilityOK();
   bool emaOK=(trend!=0 ? EMA_TrendFilter(wantBuy) : false);
   bool expBuy=false;
   bool expOK=IsExpansionCandle(expBuy);

   double tScore=0; bool scoreOK=true;
   if(InpFilter_UseTrendScore && trend!=0){ tScore=CalculateTrendScore(wantBuy); scoreOK=(tScore>=InpTrendScore_Min); }

   EnsureLabel("DF61_GT",x+10,y+162,"ENTRY CHECKLIST ("+(trend==0?"NO DIRECTION":(wantBuy?"BUY BIAS":"SELL BIAS"))+")",9,clrWhite,205);
   EnsureLabel("DF61_G1",x+10,y+178,CheckMark(expOK)+" Expansion Gate (Wyckoff) | Only expansion anchors",9,clrWhite,205);
   EnsureLabel("DF61_G2",x+10,y+194,CheckMark(volOK)+" Volatility OK (ATR regime)",9,clrWhite,205);
   EnsureLabel("DF61_G3",x+10,y+210,CheckMark(emaOK)+" EMA Filter OK (slope + side)",9,clrWhite,205);
   EnsureLabel("DF61_G4",x+10,y+226,CheckMark(scoreOK)+" TrendScore "+DoubleToString(tScore,1)+"/100 (min "+DoubleToString(InpTrendScore_Min,1)+")",9,clrWhite,205);

   string mode="MODE: ";
   if(gDailyIdle) mode+="DAILY IDLE (reset 00:00)";
   else if(CooldownActive()) mode+="COOLDOWN (force flat)";
   else if(g_cycleDir==0) mode+="HUNTING (no anchor)";
   else mode+=(g_cycleDir==1?"BUY CAMPAIGN":"SELL CAMPAIGN")+StringFormat(" | FlowAdds=%d | DDAdds=%d",g_primaryAdds,g_drawdownAdds);

   EnsureLabel("DF61_MODE",x+10,y+246,mode,9,clrWhite,205);
   EnsureLabel("DF61_ACT",x+10,y+268,"ACTION: "+actionLine,9,clrWhite,205);

   string teach="TEACH: MaxOrders="+IntegerToString(InpMaxOrdersTotal_UserSets)+
                " => PrimaryPool="+IntegerToString(gMaxPrimaryOrders)+", DrawdownPool="+IntegerToString(gMaxDrawdownOrders)+
                " | ProfitStep="+DoubleToString(InpExit_ProfitStepPrice,Digits)+
                " | AnchorClose="+(InpExit_ApplyToAnchorToo?"YES":"NO");
   EnsureLabel("DF61_TEACH",x+10,y+290,teach,8,clrSilver,205);
}

//==================================================================//
//============================ CORE LOGIC ===========================//
//==================================================================//
void ComputePools()
{
   int total=MathMax(1,InpMaxOrdersTotal_UserSets);
   gMaxPrimaryOrders=total/2;
   gMaxDrawdownOrders=total-gMaxPrimaryOrders;
}

void ResetCycle()
{
   g_cycleDir=0; g_anchorPrice=0; g_baseLot=0;
   g_primaryAdds=0; g_drawdownAdds=0;
   gAnchorEquity=0; gPeakEquity=0;
   gFreezeAdds=false;
   gLastPrimaryRef=0;

   // ladder state
   g_lastAddRefPrice=0; g_ladderLocked=false; g_reclaimLine=0;
   g_pullbackMaxAgainstPts=0; g_lastFavorablePeakPts=0;
}

void StartCampaign(bool buy,double baseLot)
{
   g_cycleDir = buy ? 1 : -1;
   g_anchorPrice = buy ? Ask : Bid;
   g_baseLot = baseLot;
   g_primaryAdds=0;
   g_drawdownAdds=0;

   gAnchorEquity=AccountEquity();
   if(gAnchorEquity<=0) gAnchorEquity=AccountBalance();
   gPeakEquity=gAnchorEquity;

   gFreezeAdds=false;
   gLastPrimaryRef=0;
   gLastAddTime=0;

   g_lastAddRefPrice = PrimaryRefPrice();
   g_ladderLocked=false;
   g_reclaimLine=0;
}

void TryAnchorEntry(string &logicLine)
{
   if(gDailyIdle){ g_LastWaitReason="WAIT: DAILY IDLE until 00:00"; logicLine=g_LastWaitReason; return; }
   if(CooldownActive()){ g_LastWaitReason="WAIT: Cooldown active"; logicLine=g_LastWaitReason; return; }

   if(CountOpenByMagic()>0){ g_LastWaitReason="WAIT: Anchor requires 0 open trades"; logicLine=g_LastWaitReason; return; }

   if(InpOneEntryPerClosedBar==1)
   {
      static datetime lastBar=0;
      if(Time[1]==lastBar){ g_LastWaitReason="WAIT: 1 entry per closed bar"; logicLine=g_LastWaitReason; return; }
      lastBar=Time[1];
   }

   int zzTrend=ZigZagTrend();
   if(zzTrend==0){ g_LastWaitReason="WAIT: ZigZag trend unknown"; logicLine=g_LastWaitReason; return; }

   bool expBuy=false;
   if(!IsExpansionCandle(expBuy))
   {
      g_LastWaitReason="WAIT: No expansion candle (Wyckoff gate)";
      logicLine=g_LastWaitReason;
      return;
   }

   bool buy=(zzTrend==1);

   if(!VolatilityOK()){ g_LastWaitReason="WAIT: Volatility too low"; logicLine=g_LastWaitReason; return; }
   if(!EMA_TrendFilter(buy)){ g_LastWaitReason="WAIT: EMA filter not aligned"; logicLine=g_LastWaitReason; return; }

   if(InpFilter_UseTrendScore)
   {
      gTrendScore=CalculateTrendScore(buy);
      if(gTrendScore < InpTrendScore_Min)
      {
         g_LastWaitReason="WAIT: Trend score weak ("+DoubleToString(gTrendScore,1)+")";
         logicLine=g_LastWaitReason;
         return;
      }
   }

   double sl=BuildATR_SL(buy);
   double lot=BuildBaseLot(buy,sl);
   if(lot<=0){ g_LastWaitReason="WAIT: Lot calc returned 0"; logicLine=g_LastWaitReason; return; }

   int t=OpenOrder(lot,buy,sl,"ANCHOR");
   if(t>0)
   {
      // reset stations at new anchor (V5.2 behavior)
      ClearStationsNow();

      StartCampaign(buy,lot);

      g_LastDecisionReason = buy ? "ENTER BUY ANCHOR: ZZ up + EXPANSION + filters OK"
                                : "ENTER SELL ANCHOR: ZZ down + EXPANSION + filters OK";
      g_LastWaitReason="";
      logicLine=g_LastDecisionReason;

      WisdoWrite("STATE","INFO",t,lot,g_anchorPrice,"ANCHOR_SET_CYCLE");
   }
   else
   {
      g_LastWaitReason="WAIT: OrderSend failed ("+IntegerToString(GetLastError())+")";
      logicLine=g_LastWaitReason;
   }
}

void TryDrawdownLadderAdd()
{
   if(!InpDD_Enable) return;
   if(g_cycleDir==0) return;
   if(gDailyIdle || CooldownActive()) return;

   static datetime lastArmTime=0;
   if(OppositeExpansionJustHappened())
      lastArmTime=TimeCurrent();

   if(lastArmTime==0) return;
   if((TimeCurrent()-lastArmTime) > 60*30) return;

   int maxDD=MathMin(100,MathMax(0,InpDD_MaxAdds_UserSet));
   if(g_drawdownAdds >= maxDD) return;
   if(CountOpenDrawdown() >= gMaxDrawdownOrders) return;

   if(!DrawdownAddReady()) return;

   bool buy=(g_cycleDir==1);
   double sl=BuildATR_SL(buy);
   double lot=BuildDrawdownLot();
   if(lot<=0) return;

   int t=OpenOrder(lot,buy,sl,"DD_ADD");
   if(t>0)
   {
      g_drawdownAdds++;
      g_LastDecisionReason="DRAWDOWN LADDER ADD: opposite expansion armed -> same-dir add";
      g_LastWaitReason="";
   }
}

//==================================================================//
//============================ INIT / DEINIT / TICK ==================//
//==================================================================//
int OnInit()
{
   ChartSetInteger(0,CHART_SHOW_GRID,false);
   ChartSetInteger(0,CHART_COLOR_GRID,clrNONE);
   ChartSetInteger(0,CHART_COLOR_BACKGROUND,clrBlack);
   ChartSetInteger(0,CHART_COLOR_FOREGROUND,clrWhite);
   ChartSetInteger(0,CHART_COLOR_VOLUME,clrDimGray);

   InitRolling();
   ComputePools();

   ResetEquityBaseline();
   gLastEquityHigh=AccountEquity();
   if(gLastEquityHigh<=0) gLastEquityHigh=AccountBalance();

   UpdateRank();
   ApplyRankCandleColors();

   ResetCycle();
   ClearStationsNow();

   gGovDayStart=DayStartBroker(TimeCurrent());
   gGovTriggersToday=0;
   gDailyIdle=false;

   g_LastDecisionReason="INIT: Ready V6.1 MIX";
   g_LastWaitReason="WAIT: Searching for expansion entry";
   WisdoWrite("STATE","INFO",0,0,0,"INIT_OK_V61_MIX");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   string names[]={"DF61_PANEL","DF61_STRIP","DF61_HEAD","DF61_RANK","DF61_STATE1","DF61_STATE2","DF61_STATE3",
                   "DF61_GOV","DF61_CAP","DF61_STRUCT","DF61_LAD","DF61_GT","DF61_G1","DF61_G2","DF61_G3","DF61_G4",
                   "DF61_MODE","DF61_ACT","DF61_TEACH"};
   for(int i=0;i<ArraySize(names);i++) ObjectDelete(0,names[i]);

   for(int k=0;k<3;k++) DeleteStationObjects(k);

   WisdoWrite("STATE","INFO",0,0,0,"DEINIT_"+IntegerToString(reason));
}

void OnTick()
{
   if(Bars < 250) return;

   ComputePools();
   UpdateDayHL();

   UpdateRank();
   ApplyRankCandleColors();

   CheckGovernorAndDailyIdle();
   CheckCooldownRelease();

   // Always update ZZ structure when possible (feeds dashboard + tightening)
   UpdateStructureFromZigZag();

   // Exits and protections (only when not forced flat)
   if(!gDailyIdle && !CooldownActive())
   {
      if(InpExit_SuperScalpEnable==1) ManageOpenTrades_SuperScalp();
      else ManageOpenTrades_StepProfit();

      CapitalTrail_UpdateAndProtect();
   }

   // If campaign active, run station engine
   if(g_cycleDir!=0)
   {
      if(NewH1BarClosed())
      {
         bool bosUp=false; double bosPrice=0; datetime bosTime=0;
         if(DetectH1BOS(g_cycleDir,bosUp,bosPrice,bosTime))
            AddNewStation(g_cycleDir,bosTime,bosPrice);
      }
      UpdateActiveStationPeak();
   }

   // V6: tighten anchor SL immediately on structure flip
   if(g_cycleDir!=0 && InpBreakEven_Enable)
   TightenAnchorSL_OnStructureFlip();


   // V6: ladder DD cap wipe + lock + reclaim
   if(g_cycleDir!=0 && CountOpenByMagic()>0)
   {
      CheckLadderDDCapAndLock();
      CheckLadderUnlockOnReclaim();
   }

   // Entries
   string logic="Idle";
   if(gDailyIdle) logic="DAILY IDLE (reset 00:00)";
   else if(CooldownActive()) logic="COOLDOWN (force flat)";
   else
   {
      if(CountOpenByMagic()==0)
      {
         TryAnchorEntry(logic);
      }
      else
      {
         // Risk-free anchor when profit trigger reached
         if(InpBreakEven_Enable)
{
   if(ProfitTriggerReached())
      MoveAnchorSLToBE();
}


         // FLOW ladder adds (collector per distance + flow triggers)
         TryFlowLadderAdd();

         // Drawdown ladder adds (same dir, armed by opposite expansion)
         TryDrawdownLadderAdd();

         logic="IN CAMPAIGN — "+g_LastDecisionReason;
      }

      if(CountOpenByMagic()==0) logic="WAITING — "+g_LastWaitReason;
   }

   DrawDashboardV61(logic);
}
//+------------------------------------------------------------------+




