//+------------------------------------------------------------------+
//| DF_HIGHTOWER_ADAPTIVE_V7.mq4                                      |
//| Swing Expansion Compounder (HIGHTOWER Doctrine)                   |
//| - Purpose: run swing campaigns using Expansion+Structure+DER       |
//| - "1060% target" is a doctrine trigger (no guarantee in markets). |
//|                                                                  |
//| V6 UPGRADES (per Derrion request):                                |
//| ✅ Manual-close respect (pause + end campaign safely)             |
//| ✅ Ladder extension clamp: ladders never extend > 500 pts from    |
//|    ORIGINAL entry (root anchor)                                  |
//| ✅ Ladder Acceleration (tight steps / faster adds when signal +   |
//|    remaining DER supports)                                       |
//| ✅ Phase-2 Ladder: re-ladder on fresh same-direction signal       |
//|    while DER still says there's more to collect                   |
//| ✅ Small-Capital Assist: "Perfect Collect" auto-close behavior    |
//|    to build small accounts across days (avoid win-then-crash)     |
//| ✅ Quantum Leap Hold: lock in + pause adding after a strong move  |
//+------------------------------------------------------------------+
#property strict

//============================ WISDO (optional) ============================//
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
      "\"event\":\""+event+"\","+                  // OPEN/CLOSE/STATE
      "\"timestamp\":"+IntegerToString(TimeCurrent())+","
      "\"trader\":\""+WisdoTraderId()+"\","
      "\"symbol\":\""+Symbol()+"\","
      "\"direction\":\""+dir+"\","
      "\"lots\":"+DoubleToString(lots,2)+","
      "\"price\":"+DoubleToString(price,Digits)+","
      "\"ticket\":"+IntegerToString(ticket)+","
      "\"culture\":"+(WisdoApproved()?"true":"false")+","
      "\"copyable\":"+((WisdoApproved() && InpWisdoCopy==WISDO_COPY_SUBSCRIBERS_ONLY)?"true":"false")+","
      "\"tag\":\""+tag+"\""
      "}";
   WisdoWriteLineSafe(j);
}

//============================ INPUTS =====================================//
input string INP_SEC_ID = "=== Identity / Execution ===";
input int    InpMagicNumber_ForThisEA = 61060;
input int    InpSlippagePoints        = 3;

input string INP_SEC_SCOPE = "=== Symbol / Timeframes ===";
input bool   InpGoldOnly = true;
input ENUM_TIMEFRAMES InpSignalTF = PERIOD_M15;
input ENUM_TIMEFRAMES InpSwingTF  = PERIOD_H1;

input string INP_SEC_DOCTRINE = "=== HIGHTOWER Doctrine (Locked Target) ===";
input double InpTargetGainPct = 1060.0;
input bool   InpAutoCaptureOnTarget = true;

input string INP_SEC_RISK = "=== Lot / Risk ===";
input int    InpLotMode_UseFixedLot = 1;
input double InpFixedBaseLot        = 0.10;
input double InpRiskPercentPerTrade = 2.0;

input string INP_SEC_SAFETY = "=== Safety Stop (Broker SL) ===";
input int    InpATR_Period_SL      = 14;
input double InpATR_SL_Multiplier  = 2.2;
input int    InpATR_SL_BufferPts   = 80;

//====================== V6: MANUAL CLOSE RESPECT =========================//
input string INP_SEC_MANUAL = "=== V6: Manual Close Respect ===";
input bool   InpRespectManualClose         = true;
input int    InpManualCloseCooldownMinutes = 45;   // pause after you manually close

//====================== V6: LADDER CLAMP + ACCEL =========================//
input string INP_SEC_V6_LAD = "=== V6: Ladder Clamp + Acceleration ===";
input int    InpMaxLadderExtensionPts   = 500;   // NEVER add ladders if > this from ROOT entry
input bool   InpAccel_Enable            = true;
input double InpAccel_RemainingDER_Min  = 0.25;  // require remaining DER >= this (0..1) to accelerate
input double InpAccel_StepFactor        = 0.65;  // tighter steps (lower = tighter)
input double InpAccel_JumpMult          = 1.25;  // lot jump multiplier during acceleration
input int    InpAccel_MinSecondsBetweenAdds = 35; // faster adds (still safe)

//====================== V6: PHASE-2 LADDER ===============================//
input string INP_SEC_V6_PHASE = "=== V6: Phase-2 Ladder (Re-ladder) ===";
input bool   InpPhase2_Enable              = true;
input double InpPhase2_MinRemainingDER     = 0.18; // if remaining DER below this, stop phasing
input int    InpPhase2_MinSecondsBetweenPhases = 180;
input int    InpPhase2_MaxPhases           = 6;

//====================== V6: PERFECT COLLECT + SMALL CAP ASSIST ============//
input string INP_SEC_V6_PC = "=== V6: Perfect Collect (Small-Capital Assist) ===";
input bool   InpPerfectCollect_Enable      = true;
input double InpPerfectCollect_GainPct     = 45.0;   // close campaign when equity gain hits this (smaller than 1060)
input double InpPerfectCollect_MinProfit   = 8.0;    // require at least $ profit
input double InpPerfectCollect_DERCollectedPct = 0.55; // OR if MoveToday >= this and profit is positive

input bool   InpSmallCap_Enable            = true;
input double InpSmallCap_MaxBalance        = 300.0;  // if balance <= this, always obey Perfect Collect
input bool   InpSmallCap_ForceDailyIdleAfterPerfectCollect = true;

//====================== V6: QUANTUM LEAP HOLD ============================//
input string INP_SEC_V6_QL = "=== V6: Quantum Leap Hold ===";
input bool   InpQuantumLeap_Enable         = true;
input int    InpQuantumLeap_Pts            = 220;  // once move from anchor >= this, lock SL + hold
input int    InpQuantumLeap_BEBufferPts    = 25;   // BE + buffer
input bool   InpQuantumLeap_HoldStopsAdds  = true; // pause ladder adds once quantum leap triggered

//====================== ADAPTIVE BALANCE TIER ENGINE ======================//
input string INP_SEC_ADAPT = "=== ADAPTIVE: Tier Presets (Locked at Day Start) ===";
input bool   InpAdaptive_Enable = true;

input double InpTier1_LeBalance = 200;
input double InpTier2_LeBalance = 1000;
input double InpTier3_LeBalance = 10000;
input double InpTier4_LeBalance = 100000;

input double InpTier1_Jump_Min   = 0.05;
input double InpTier1_Jump_Start = 0.05;
input double InpTier1_Jump_Max   = 0.10;

input double InpTier2_Jump_Min   = 0.08;
input double InpTier2_Jump_Start = 0.10;
input double InpTier2_Jump_Max   = 0.20;

input double InpTier3_Jump_Min   = 0.20;
input double InpTier3_Jump_Start = 0.30;
input double InpTier3_Jump_Max   = 0.60;

input double InpTier4_Jump_Min   = 0.50;
input double InpTier4_Jump_Start = 0.80;
input double InpTier4_Jump_Max   = 1.50;

input double InpTier5_Jump_Min   = 0.80;
input double InpTier5_Jump_Start = 1.50;
input double InpTier5_Jump_Max   = 3.00;

input int InpTier1_Adds_Base = 8;
input int InpTier1_Adds_Max  = 20;

input int InpTier2_Adds_Base = 16;
input int InpTier2_Adds_Max  = 50;

input int InpTier3_Adds_Base = 40;
input int InpTier3_Adds_Max  = 120;

input int InpTier4_Adds_Base = 120;
input int InpTier4_Adds_Max  = 250;

input int InpTier5_Adds_Base = 180;
input int InpTier5_Adds_Max  = 350;

input double InpTier1_ATRMult_Add = 0.0;
input int    InpTier1_Buf_AddPts  = 0;

input double InpTier2_ATRMult_Add = 0.2;
input int    InpTier2_Buf_AddPts  = 60;

input double InpTier3_ATRMult_Add = 0.4;
input int    InpTier3_Buf_AddPts  = 120;

input double InpTier4_ATRMult_Add = 0.6;
input int    InpTier4_Buf_AddPts  = 220;

input double InpTier5_ATRMult_Add = 0.8;
input int    InpTier5_Buf_AddPts  = 320;

input double InpAdaptive_JumpStepOnWin = 0.05;
input double InpAdaptive_JumpStepOnLoss= 0.03;
input int    InpAdaptive_AddsStepOnWin = 20;
input int    InpAdaptive_AddsStepOnLoss= 10;
input double InpAdaptive_ATRMultStepOnWin = 0.10;
input int    InpAdaptive_BufPtsStepOnWin  = 40;

input bool   InpAdaptive_LockTierForDay = true;

//============================ DER: Daily Expected Range Engine =============//
input string INP_SEC_DER = "=== DER: Daily Expected Range Engine ===";
input int    InpDER_Days = 5;
input double InpDER_HeavyZonePct = 0.60;
input double InpDER_ExhaustionPct = 0.85;

// Base throttle (V6 can accelerate this lower)
input int    InpMinSecondsBetweenAdds = 60;

input string INP_SEC_LADDER = "=== Ladder (Range-aware) ===";
input double InpLadderMinStepPctLeft = 0.10;
input double InpLadderMaxStepPctLeft = 0.22;

// Legacy defaults (used only when Adaptive disabled)
input int    InpMaxLadderAdds_Legacy      = 12;
input double InpLadderLotIncrement_Legacy = 0.04;

input string INP_SEC_FILTERS = "=== Filters (Trend / RSI / Structure) ===";
input bool   InpUseEMAFilter = true;
input int    InpEMA_Period   = 50;
input double InpEMA_MinSlopePts = 8;
input bool   InpUseRSIConfirm = true;
input int    InpRSI_Period    = 14;
input int    InpRSI_BuyMin    = 50;
input int    InpRSI_SellMax   = 50;

input string INP_SEC_ZZ = "=== ZigZag Structure ===";
input int    InpZZ_Depth      = 12;
input int    InpZZ_Deviation  = 5;
input int    InpZZ_Backstep   = 3;
input int    InpZZ_LookbackBars= 250;
input int    InpZZ_MinSwings  = 2;
input int    InpStruct_MinSwingPts = 200;

input string INP_SEC_PROTECT = "=== Ladder Protection (Non-Anchor Wipe) ===";
input bool   InpProtect_Enable = true;
input int    InpProtect_MaxAgainstPts = 450;
input bool   InpProtect_UseStructureFlip = true;
input bool   InpProtect_UseTriangle = true;
input int    InpTriangle_LookbackBars = 40;

input string INP_SEC_AUTOMOW = "=== Daily Idle (After Win) ===";
input bool   InpDailyIdle_Enable         = true;
input bool   InpDailyIdle_RestOfDay      = true;

input string INP_SEC_RECLAIM = "=== Ladder Reclaim (Retry Lost Ladder Level) ===";
input bool   InpReclaim_Enable         = true;
input int    InpReclaim_MaxStored      = 40;
input int    InpReclaim_TolerancePts   = 60;
input int    InpReclaim_MinSecondsBetweenTries = 45;
input bool   InpReclaim_RequireEMA_RSI = true;

input string INP_SEC_UI = "=== UI / Dashboard / Themes ===";
input bool   InpNoGrid     = true;
input bool   InpDashboard  = true;
input int    InpDashCorner = CORNER_LEFT_UPPER;
input int    InpDashX      = 10;
input int    InpDashY      = 10;

//============================ GLOBALS ====================================//
datetime NextResumeTime()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(),dt);

   dt.hour = InpDailyIdleResumeHour;
   dt.min  = 0;
   dt.sec  = 0;

   datetime resume = StructToTime(dt);

   // if already past resume time today → go to tomorrow
   if(TimeCurrent() >= resume)
      resume += 86400;

   return resume;
}
double g_equityBuffer[120];
int g_eqIndex=0;
void UpdateEquityBuffer()
{
   g_equityBuffer[g_eqIndex] = AccountEquity();
   g_eqIndex++;

   if(g_eqIndex >= ArraySize(g_equityBuffer))
      g_eqIndex = 0;
}
//====================== SESSION GATE + VICTORY LOCK =======================//
input string INP_SEC_SESSION = "=== Session Gate / Victory Lock ===";
input bool   InpSessionGate_Enable     = true;  // HARD BLOCK before 3:00 broker time
input int    InpSessionStartHour       = 3;     // broker time hour to start trading (03:00)

input bool   InpVictoryLock_Enable     = true;  // lock day after hitting gain threshold
input double InpVictoryLock_GainPct    = 400.0; // example: lock after +400% session gain
input bool   InpVictoryLock_CloseAll   = true;  // close open trades when victory hits

string GVKey(string suffix)
{
   return "HT7_"+IntegerToString(AccountNumber())+"_"+Symbol()+"_"+suffix;
}

void SaveIdleUntil(datetime t)
{
   GlobalVariableSet(GVKey("IDLE_UNTIL"), (double)t);
}

datetime LoadIdleUntil()
{
   if(!GlobalVariableCheck(GVKey("IDLE_UNTIL"))) return 0;
   return (datetime)GlobalVariableGet(GVKey("IDLE_UNTIL"));
}

void SaveSessionStartEquity(double eq)
{
   GlobalVariableSet(GVKey("SESSION_EQ"), eq);
}

double LoadSessionStartEquity()
{
   if(!GlobalVariableCheck(GVKey("SESSION_EQ"))) return 0;
   return GlobalVariableGet(GVKey("SESSION_EQ"));
}

void SaveSessionStartTime(datetime t)
{
   GlobalVariableSet(GVKey("SESSION_T"), (double)t);
}

datetime LoadSessionStartTime()
{
   if(!GlobalVariableCheck(GVKey("SESSION_T"))) return 0;
   return (datetime)GlobalVariableGet(GVKey("SESSION_T"));
}

//====================== V7: CAPTURE PERSISTENCE ===========================//
string CapturesKey()
{
   return GVKey("CAPTURES");
}
void SaveCaptures()
{
   GlobalVariableSet(CapturesKey(), (double)g_captures);
}
int LoadCaptures()
{
   if(!GlobalVariableCheck(CapturesKey())) return 0;
   return (int)GlobalVariableGet(CapturesKey());
}

//====================== V7: EQUITY GRAPH BUFFER ===========================//
double   g_eqBuf[240];
datetime g_eqBufT[240];
int      g_eqN=0;
datetime g_lastEqSample=0;

void EqGraphReset()
{
   ArrayInitialize(g_eqBuf, 0.0);
   ArrayInitialize(g_eqBufT, 0);
   g_eqN=0;
   g_lastEqSample=0;
}

void EqGraphSample()
{
   if(!InpDashboard) return;

   int step = MathMax(10, InpEquityGraphStepSec);
   datetime now = TimeCurrent();
   if(g_lastEqSample != 0 && (now - g_lastEqSample) < step) return;

   g_lastEqSample = now;
   double eq = AccountEquity();
   if(eq <= 0) eq = AccountBalance();

   int maxN = MathMax(20, MathMin(InpEquityGraphPoints, 240));

   if(g_eqN < maxN)
   {
      g_eqBuf[g_eqN] = eq;
      g_eqBufT[g_eqN] = now;
      g_eqN++;
   }
   else
   {
      // shift left
      for(int i=1;i<maxN;i++)
      {
         g_eqBuf[i-1] = g_eqBuf[i];
         g_eqBufT[i-1] = g_eqBufT[i];
      }
      g_eqBuf[maxN-1] = eq;
      g_eqBufT[maxN-1] = now;
   }
}

//============================ EQUITY GRAPH (MT4 SAFE) ============================//
void DrawEquityGraph()
{
   int maxPoints = InpEquityGraphPoints;
   if(maxPoints < 5) return;

   int bars = MathMin(g_eqIndex, maxPoints-1);
   if(bars < 2) return;

   double minEq = g_equityBuffer[0];
   double maxEq = g_equityBuffer[0];

   for(int i=1;i<bars;i++)
   {
      if(g_equityBuffer[i] < minEq) minEq = g_equityBuffer[i];
      if(g_equityBuffer[i] > maxEq) maxEq = g_equityBuffer[i];
   }

   double range = maxEq - minEq;
   if(range <= 0) range = 1;

   for(int i=0;i<bars-1;i++)
   {
      string name = "EQ_SEG_"+IntegerToString(i);

      datetime t1 = TimeCurrent() - (bars-i)*60;
      datetime t2 = TimeCurrent() - (bars-(i+1))*60;

      double p1 = minEq + (g_equityBuffer[i]-minEq)/range * 200 * Point;
      double p2 = minEq + (g_equityBuffer[i+1]-minEq)/range * 200 * Point;

      if(ObjectFind(0,name) < 0)
      {
         ObjectCreate(0,name,OBJ_TREND,0,t1,p1,t2,p2);
         ObjectSetInteger(0,name,OBJPROP_COLOR,clrLime);
         ObjectSetInteger(0,name,OBJPROP_WIDTH,2);
      }
      else
      {
         ObjectMove(0,name,0,t1,p1);
         ObjectMove(0,name,1,t2,p2);
      }
   }
}
datetime SessionStartToday()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   dt.hour = InpDailyIdleResumeHour;
   dt.min  = 0;
   dt.sec  = 0;
   return StructToTime(dt);
}

bool BeforeSessionStartNow()
{
   return (TimeCurrent() < SessionStartToday());
}

double   g_sessionStartEquity = 0;
datetime g_sessionStartTime   = 0;
double   g_anchorPrice=0;
double   g_rootAnchorPrice=0;     // ORIGINAL entry anchor (never changes during campaign)
int      g_dir=0;                 // +1 buy, -1 sell
double   g_baseLot=0;
int      g_adds=0;
datetime g_lastAddTime=0;
datetime g_dailyIdleUntil = 0;
double   g_campaignStartEquity=0;
double   g_campaignTargetEquity=0;
int      g_captures=0;

bool     g_dailyIdleToday=false;
datetime g_dailyIdleDayStart=0;

datetime g_dayStart=0;
double   g_dayOpen=0;
double   g_DER=0;
double   g_todayMove=0;
double   g_remaining=0;
bool     g_ladderLocked=false;
double   g_reclaimLine=0;

double g_lastHigh=0, g_prevHigh=0, g_lastLow=0, g_prevLow=0;
string g_lastHighTag="", g_lastLowTag="";

string g_action="INIT";
string g_mode="HUNTING";

color  gThemeBG=clrBlack;
color  gThemeAccent=clrDodgerBlue;
color  gThemeBull=clrLime;
color  gThemeBear=clrTomato;
color  gThemeText=clrWhite;

// Reclaim storage
double   g_reclaimPrice[200];
double   g_reclaimLot[200];
int      g_reclaimDir[200];
datetime g_reclaimStoredAt[200];
int      g_reclaimCount=0;
datetime g_lastReclaimTry=0;

// Closed history processing
datetime g_lastHistoryScan=0;

// ADAPTIVE RUNTIME (locked daily)
int      g_tier=1;
string   g_tierName="T1-MICRO";
double   g_dayStartBalance=0;

double   g_jumpRuntime=0.04;
int      g_maxAddsRuntime=12;
double   g_atrMultRuntime=2.2;
int      g_slBufRuntimePts=80;

int      g_winsToday=0;
int      g_lossesToday=0;

// campaign end detection
bool     g_campaignLive=false;
double   g_campaignStartEqSnapshot=0;

// V6: manual close pause
int      g_prevOpenCount=0;
datetime g_manualPauseUntil=0;
string   g_lastEACloseReason="";

// V6: phase engine
int      g_phase=0;
int      g_phaseCount=0;
datetime g_lastPhaseTime=0;

// V6: quantum hold
bool     g_quantumHold=false;

//============================ UTILS ======================================//
double PipValuePoint()
{
   double tv=MarketInfo(Symbol(),MODE_TICKVALUE);
   double ts=MarketInfo(Symbol(),MODE_TICKSIZE);
   if(ts<=0) ts=Point;
   return tv*(Point/ts);
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

double ATR_TF(ENUM_TIMEFRAMES tf,int period,int shift){ return iATR(Symbol(),tf,period,shift); }

datetime DayStartBroker(datetime t)
{
   datetime d0=iTime(Symbol(),PERIOD_D1,0);
   if(d0>0) return d0;
   MqlDateTime dt; TimeToStruct(t,dt);
   dt.hour=0; dt.min=0; dt.sec=0;
   return StructToTime(dt);
}

int CountOpenEA()
{
   int c=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
      if(OrderSelect(i,SELECT_BY_POS,MODE_TRADES))
         if(OrderMagicNumber()==InpMagicNumber_ForThisEA && OrderSymbol()==Symbol())
            c++;
   return c;
}

bool IsAnchor(string c){ return (StringFind(c,"HT_ANCHOR")>=0); }
bool IsLadder(string c){ return (StringFind(c,"HT_LADDER")>=0); }

//====================== ADAPTIVE TIER ENGINE ==============================//
int DetermineTier(double bal)
{
   if(bal<=0) bal=AccountBalance();
   if(bal<=InpTier1_LeBalance) return 1;
   if(bal<=InpTier2_LeBalance) return 2;
   if(bal<=InpTier3_LeBalance) return 3;
   if(bal<=InpTier4_LeBalance) return 4;
   return 5;
}

string TierName(int t)
{
   if(t==1) return "T1-MICRO";
   if(t==2) return "T2-BUILDER";
   if(t==3) return "T3-EXPANSION";
   if(t==4) return "T4-DOMINION";
   return "T5-EMPIRE";
}

void TierPreset(int t,
                double &jumpMin,double &jumpStart,double &jumpMax,
                int &addsBase,int &addsMax,
                double &atrAdd,int &bufAddPts)
{
   if(t==1){ jumpMin=InpTier1_Jump_Min; jumpStart=InpTier1_Jump_Start; jumpMax=InpTier1_Jump_Max; addsBase=InpTier1_Adds_Base; addsMax=InpTier1_Adds_Max; atrAdd=InpTier1_ATRMult_Add; bufAddPts=InpTier1_Buf_AddPts; return; }
   if(t==2){ jumpMin=InpTier2_Jump_Min; jumpStart=InpTier2_Jump_Start; jumpMax=InpTier2_Jump_Max; addsBase=InpTier2_Adds_Base; addsMax=InpTier2_Adds_Max; atrAdd=InpTier2_ATRMult_Add; bufAddPts=InpTier2_Buf_AddPts; return; }
   if(t==3){ jumpMin=InpTier3_Jump_Min; jumpStart=InpTier3_Jump_Start; jumpMax=InpTier3_Jump_Max; addsBase=InpTier3_Adds_Base; addsMax=InpTier3_Adds_Max; atrAdd=InpTier3_ATRMult_Add; bufAddPts=InpTier3_Buf_AddPts; return; }
   if(t==4){ jumpMin=InpTier4_Jump_Min; jumpStart=InpTier4_Jump_Start; jumpMax=InpTier4_Jump_Max; addsBase=InpTier4_Adds_Base; addsMax=InpTier4_Adds_Max; atrAdd=InpTier4_ATRMult_Add; bufAddPts=InpTier4_Buf_AddPts; return; }
   jumpMin=InpTier5_Jump_Min; jumpStart=InpTier5_Jump_Start; jumpMax=InpTier5_Jump_Max; addsBase=InpTier5_Adds_Base; addsMax=InpTier5_Adds_Max; atrAdd=InpTier5_ATRMult_Add; bufAddPts=InpTier5_Buf_AddPts;
}

double ClampD(double v,double lo,double hi){ return MathMax(lo, MathMin(v,hi)); }
int    ClampI(int v,int lo,int hi){ return MathMax(lo, MathMin(v,hi)); }

void ApplyDayTierLock(bool force)
{
   if(!InpAdaptive_Enable)
   {
      g_tier=1;
      g_tierName="LEGACY";
      g_jumpRuntime=InpLadderLotIncrement_Legacy;
      g_maxAddsRuntime=InpMaxLadderAdds_Legacy;
      g_atrMultRuntime=InpATR_SL_Multiplier;
      g_slBufRuntimePts=InpATR_SL_BufferPts;
      return;
   }

   if(!force && InpAdaptive_LockTierForDay && g_dayStartBalance>0) return;

   g_dayStartBalance = AccountBalance();
   g_tier = DetermineTier(g_dayStartBalance);
   g_tierName = TierName(g_tier);

   double jMin,jStart,jMax, atrAdd;
   int addsBase,addsMax, bufAdd;
   TierPreset(g_tier, jMin,jStart,jMax, addsBase,addsMax, atrAdd,bufAdd);

   g_jumpRuntime = ClampD(jStart, jMin, jMax);
   g_maxAddsRuntime = ClampI(addsBase, 0, InpTier5_Adds_Max);
   g_atrMultRuntime = InpATR_SL_Multiplier + atrAdd;
   g_slBufRuntimePts = InpATR_SL_BufferPts + bufAdd;

   g_winsToday=0;
   g_lossesToday=0;

   WisdoWrite("STATE","INFO",0,0,g_dayStartBalance,"HT_TIER_LOCK_"+g_tierName);
}

void AdaptiveOnWin()
{
   if(!InpAdaptive_Enable) return;

   double jMin,jStart,jMax, atrAdd;
   int addsBase,addsMax, bufAdd;
   TierPreset(g_tier, jMin,jStart,jMax, addsBase,addsMax, atrAdd,bufAdd);

   g_winsToday++;

   g_jumpRuntime = ClampD(g_jumpRuntime + InpAdaptive_JumpStepOnWin, jMin, jMax);
   g_maxAddsRuntime = ClampI(g_maxAddsRuntime + InpAdaptive_AddsStepOnWin, addsBase, addsMax);

   g_atrMultRuntime = ClampD(g_atrMultRuntime + InpAdaptive_ATRMultStepOnWin, 0.5, 10.0);
   g_slBufRuntimePts = ClampI(g_slBufRuntimePts + InpAdaptive_BufPtsStepOnWin, 0, 5000);

   WisdoWrite("STATE","INFO",0,g_jumpRuntime,(double)g_maxAddsRuntime,"HT_ADAPT_WIN_"+g_tierName);
}

void AdaptiveOnLoss()
{
   if(!InpAdaptive_Enable) return;

   double jMin,jStart,jMax, atrAdd;
   int addsBase,addsMax, bufAdd;
   TierPreset(g_tier, jMin,jStart,jMax, addsBase,addsMax, atrAdd,bufAdd);

   g_lossesToday++;

   g_jumpRuntime = ClampD(g_jumpRuntime - InpAdaptive_JumpStepOnLoss, jMin, jMax);
   g_maxAddsRuntime = ClampI(g_maxAddsRuntime - InpAdaptive_AddsStepOnLoss, addsBase, addsMax);

   double baseAtr = InpATR_SL_Multiplier + atrAdd;
   int baseBuf = InpATR_SL_BufferPts + bufAdd;

   g_atrMultRuntime = ClampD((g_atrMultRuntime + baseAtr)*0.5, baseAtr, 10.0);
   g_slBufRuntimePts = ClampI((g_slBufRuntimePts + baseBuf)/2, baseBuf, 5000);

   WisdoWrite("STATE","INFO",0,g_jumpRuntime,(double)g_maxAddsRuntime,"HT_ADAPT_LOSS_"+g_tierName);
}

//============================ ORDERS ======================================//
int OpenOrder(double lot,bool buy,double sl,string tag)
{
   // V7: hard safety cap on order lot
   if(InpMaxLotCap > 0) lot = MathMin(lot, InpMaxLotCap);
   lot = NormalizeLot(lot);
   if(lot <= 0) return -1;

   int type=buy?OP_BUY:OP_SELL;
   double price=buy?Ask:Bid;
   int t=OrderSend(Symbol(),type,lot,price,InpSlippagePoints,sl,0,tag,InpMagicNumber_ForThisEA,0,gThemeAccent);
   if(t>0) WisdoWrite("OPEN",buy?"BUY":"SELL",t,lot,price,tag);
   return t;
}

bool CloseTicket(int ticket,string reason)
{
   if(!OrderSelect(ticket,SELECT_BY_TICKET,MODE_TRADES)) return false;
   int type=OrderType();
   if(type!=OP_BUY && type!=OP_SELL) return false;
   bool buy=(type==OP_BUY);
   double price=buy?Bid:Ask;
   double lots=OrderLots();
   bool ok=OrderClose(ticket,lots,price,InpSlippagePoints,gThemeAccent);
   if(ok)
   {
      g_lastEACloseReason = reason;
      WisdoWrite("CLOSE",buy?"BUY":"SELL",ticket,lots,price,reason);
   }
   return ok;
}

void CloseAll(string reason)
{
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      CloseTicket(OrderTicket(),reason);
   }
}

void CloseLaddersOnly(string reason)
{
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      if(IsAnchor(OrderComment())) continue;
      CloseTicket(OrderTicket(),reason);
   }
}

double FloatingProfitEA()
{
   double p=0;
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;
      p += (OrderProfit()+OrderSwap()+OrderCommission());
   }
   return p;
}

//============================ SL BUILD ====================================//
double BuildSL(bool buy)
{
   double atr = ATR_TF(InpSignalTF,InpATR_Period_SL,1);
   if(atr<=0) atr=10*Point;

   double mult = (InpAdaptive_Enable ? g_atrMultRuntime : InpATR_SL_Multiplier);
   int    bufPts = (InpAdaptive_Enable ? g_slBufRuntimePts : InpATR_SL_BufferPts);

   double dist = atr*mult + bufPts*Point;
   double entry = buy ? Ask : Bid;
   return buy ? (entry - dist) : (entry + dist);
}

double CalcLot_Risk(double sl,bool buy)
{
   double ep = buy?Ask:Bid;
   double distPoints=MathAbs(ep-sl)/Point;
   if(distPoints<=1) return 0;
   double riskMoney=AccountBalance()*InpRiskPercentPerTrade/100.0;
   double lot=riskMoney/(distPoints*PipValuePoint());
   return NormalizeLot(lot);
}

//============================ DER =========================================//
double CalcDER_Points(int days)
{
   int N=MathMax(2,MathMin(days,20));
   double sum=0;
   int got=0;

   for(int i=1;i<=N;i++)
   {
      double hi=iHigh(Symbol(),PERIOD_D1,i);
      double lo=iLow(Symbol(),PERIOD_D1,i);
      if(hi<=0 || lo<=0) continue;
      double r=(hi-lo)/Point;
      if(r<=0) continue;
      sum += r;
      got++;
   }
   if(got<2) return 0;
   return sum/got;
}

void UpdateDER()
{
   datetime ds=DayStartBroker(TimeCurrent());
   if(g_dayStart==0 || ds!=g_dayStart)
   {
      g_dayStart=ds;
      g_dayOpen=iOpen(Symbol(),PERIOD_D1,0);
      if(g_dayOpen<=0) g_dayOpen=Open[0];

      g_DER=CalcDER_Points(InpDER_Days);
      if(g_DER<=0) g_DER=2000;

      g_ladderLocked=false;
      g_reclaimLine=0;
      g_quantumHold=false;

      // don't break an active idle that extends past midnight
if(!(g_dailyIdleToday && g_dailyIdleUntil > TimeCurrent()))
{
   g_dailyIdleToday=false;
   g_dailyIdleUntil=0;
}
g_dailyIdleDayStart=g_dayStart;
      g_dailyIdleDayStart=g_dayStart;
      g_dailyIdleUntil = 0;
      g_dayStartBalance=0;
      ApplyDayTierLock(true);

      WisdoWrite("STATE","INFO",0,0,g_DER,"HT_NEW_DAY_DER_RESET");
   }

   double price=Bid;
   g_todayMove = MathAbs(price - g_dayOpen)/Point;
   g_remaining = MathMax(0.0, g_DER - g_todayMove);
}

double RemainingPct(){ if(g_DER<=0) return 0; return MathMax(0.0, MathMin(1.0, g_remaining/g_DER)); }
double TodayMovePct(){ if(g_DER<=0) return 0; return MathMax(0.0, MathMin(1.0, g_todayMove/g_DER)); }

//============================ TREND / FILTERS ============================//
double EMA(ENUM_TIMEFRAMES tf,int period,int shift){ return iMA(Symbol(),tf,period,0,MODE_EMA,PRICE_CLOSE,shift); }

bool EMAFilterOK(bool wantBuy)
{
   if(!InpUseEMAFilter) return true;
   double emaNow=EMA(InpSignalTF,InpEMA_Period,0);
   double emaPrev=EMA(InpSignalTF,InpEMA_Period,5);
   double slopePts=(emaNow-emaPrev)/Point;

   double c=iClose(Symbol(),InpSignalTF,0);
   if(wantBuy)
   {
      if(c<emaNow) return false;
      if(slopePts<InpEMA_MinSlopePts) return false;
   }
   else
   {
      if(c>emaNow) return false;
      if(slopePts>-InpEMA_MinSlopePts) return false;
   }
   return true;
}

bool RSIConfirmOK(bool wantBuy)
{
   if(!InpUseRSIConfirm) return true;
   double r=iRSI(Symbol(),InpSignalTF,InpRSI_Period,PRICE_CLOSE,0);
   if(r<=0) return false;
   if(wantBuy) return (r>=InpRSI_BuyMin);
   return (r<=InpRSI_SellMax);
}

//============================ ZIGZAG STRUCTURE ============================//
int ZigZagTrend()
{
   int found=0;
   double swings[10]; ArrayInitialize(swings,0);

   int look=InpZZ_LookbackBars;
   if(look<60) look=60;
   if(look>Bars-10) look=Bars-10;

   for(int i=1;i<look && found<10;i++)
   {
      double val=iCustom(Symbol(),InpSignalTF,"ZigZag",InpZZ_Depth,InpZZ_Deviation,InpZZ_Backstep,0,i);
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

bool UpdateStructureFromZigZag()
{
   int look=InpZZ_LookbackBars;
   if(look<120) look=120;

   double lastHigh=0, prevHigh=0, lastLow=0, prevLow=0;

   for(int i=1;i<look;i++)
   {
      double val=iCustom(Symbol(),InpSignalTF,"ZigZag",InpZZ_Depth,InpZZ_Deviation,InpZZ_Backstep,0,i);
      if(val==0.0 || val==EMPTY_VALUE) continue;

      double hi=iHigh(Symbol(),InpSignalTF,i);
      double lo=iLow(Symbol(), InpSignalTF,i);
      double tol=3*Point;

      bool isHigh=(MathAbs(val-hi)<=tol) || (val>=hi-tol);
      bool isLow =(MathAbs(val-lo)<=tol) || (val<=lo+tol);

      if(isHigh)
      {
         if(lastHigh==0) lastHigh=val;
         else if(prevHigh==0)
         {
            if(MathAbs(lastHigh-val) >= InpStruct_MinSwingPts*Point) prevHigh=val;
         }
      }
      else if(isLow)
      {
         if(lastLow==0) lastLow=val;
         else if(prevLow==0)
         {
            if(MathAbs(lastLow-val) >= InpStruct_MinSwingPts*Point) prevLow=val;
         }
      }
      if(lastHigh>0 && prevHigh>0 && lastLow>0 && prevLow>0) break;
   }

   if(lastHigh<=0 || prevHigh<=0 || lastLow<=0 || prevLow<=0) return false;

   g_prevHigh=prevHigh; g_lastHigh=lastHigh;
   g_prevLow =prevLow;  g_lastLow =lastLow;

   g_lastHighTag = (g_lastHigh>g_prevHigh ? "HH" : "LH");
   g_lastLowTag  = (g_lastLow >g_prevLow  ? "HL" : "LL");
   return true;
}

bool StructureFlipAgainst(int dir)
{
   if(dir== 1) return (g_lastLowTag=="LL");
   if(dir==-1) return (g_lastHighTag=="HH");
   return false;
}

//============================ Triangle Heuristic ===========================//
bool TriangleCompression(int lookback, double &top, double &bot)
{
   top=0; bot=0;
   int N=MathMax(20,MathMin(lookback,120));
   double hi=-1e10, lo= 1e10;

   for(int i=1;i<=N;i++)
   {
      double h=iHigh(Symbol(),InpSignalTF,i);
      double l=iLow(Symbol(), InpSignalTF,i);
      if(h>hi) hi=h;
      if(l<lo) lo=l;
   }
   top=hi; bot=lo;
   if(top<=bot) return false;

   double sumA=0,sumB=0;
   int k=10;
   for(int i=1;i<=k;i++) sumA += (iHigh(Symbol(),InpSignalTF,i)-iLow(Symbol(),InpSignalTF,i))/Point;
   for(int j=N-k+1;j<=N;j++) sumB += (iHigh(Symbol(),InpSignalTF,j)-iLow(Symbol(),InpSignalTF,j))/Point;

   double a=sumA/k, b=sumB/k;
   if(a<=0 || b<=0) return false;
   return (a < b*0.75);
}

bool TriangleBreakAgainstDir(int dir)
{
   if(!InpProtect_UseTriangle) return false;
   double top,bot;
   if(!TriangleCompression(InpTriangle_LookbackBars,top,bot)) return false;

   double c=iClose(Symbol(),InpSignalTF,1);
   double buf = (MarketInfo(Symbol(),MODE_SPREAD)+8)*Point;

   if(dir== 1) return (c < bot - buf);
   if(dir==-1) return (c > top + buf);
   return false;
}

//============================ CAMPAIGN / DOCTRINE =========================//
void ResetCampaign()
{
   g_dir=0;
   g_anchorPrice=0;
   g_rootAnchorPrice=0;
   g_baseLot=0;
   g_adds=0;
   g_lastAddTime=0;
   g_ladderLocked=false;
   g_reclaimLine=0;
   g_campaignStartEquity=0;
   g_campaignTargetEquity=0;
   g_campaignLive=false;
   g_campaignStartEqSnapshot=0;

   g_phase=0;
   g_phaseCount=0;
   g_lastPhaseTime=0;
   g_quantumHold=false;
}

void StartCampaign(bool buy,double baseLot)
{
   g_dir = buy? 1 : -1;
   g_anchorPrice = buy ? Ask : Bid;
   g_rootAnchorPrice = g_anchorPrice;      // V6: root anchor is locked
   g_baseLot = baseLot;
   g_adds=0;
   g_lastAddTime=0;

   g_campaignStartEquity = AccountEquity();
   if(g_campaignStartEquity<=0) g_campaignStartEquity=AccountBalance();

   double mult = 1.0 + (InpTargetGainPct/100.0);
   g_campaignTargetEquity = g_campaignStartEquity * mult;

   g_campaignLive=true;
   g_campaignStartEqSnapshot=g_campaignStartEquity;

   g_phase=1;
   g_phaseCount=1;
   g_lastPhaseTime=TimeCurrent();

   g_action = "ANCHOR_SET: Campaign started";
   WisdoWrite("STATE","INFO",0,0,g_campaignTargetEquity,"HT_CAMPAIGN_TARGET_SET");
}

bool CampaignTargetHit()
{
   if(g_dir==0) return false;
   if(!InpAutoCaptureOnTarget) return false;
   if(g_campaignTargetEquity<=0) return false;
   return (AccountEquity() >= g_campaignTargetEquity);
}

//============================ V6: PERFECT COLLECT =========================//
bool IsSmallCap()
{
   if(!InpSmallCap_Enable) return false;
   return (AccountBalance() <= InpSmallCap_MaxBalance);
}

bool PerfectCollectHit()
{
   if(!InpPerfectCollect_Enable) return false;
   if(g_campaignStartEquity<=0) return false;
   if(CountOpenEA()<=0) return false;

   double eq=AccountEquity();
   double fp=FloatingProfitEA();

   if(fp < InpPerfectCollect_MinProfit) return false;

   double pcEq = g_campaignStartEquity * (1.0 + InpPerfectCollect_GainPct/100.0);

   // 1) equity gain condition
   if(eq >= pcEq) return true;

   // 2) DER collected condition (keeps you from chasing late)
   if(TodayMovePct() >= InpPerfectCollect_DERCollectedPct && fp > 0.0) return true;

   return false;
}

void DoPerfectCollect(string why)
{
   CloseAll("HT_PERFECT_COLLECT_"+why);
   AdaptiveOnWin();
   g_action="PERFECT COLLECT: "+why;

   WisdoWrite("STATE","INFO",0,0,AccountEquity(),"HT_PERFECT_COLLECT_"+why);

   if(InpSmallCap_ForceDailyIdleAfterPerfectCollect && IsSmallCap())
   {
      g_dailyIdleToday=true;
g_dailyIdleDayStart=g_dayStart;

// resume next day at 4 AM (V7)
g_dailyIdleUntil = NextResumeTime();
      WisdoWrite("STATE","INFO",0,0,0,"HT_SMALLCAP_DAILY_IDLE_AFTER_PC");
   }

   ResetCampaign();
}

//============================ ENTRY (Swing Anchor) =========================//
bool ExpansionCandle(bool &buyOut)
{
   double atr=ATR_TF(InpSignalTF,InpATR_Period_SL,1);
   if(atr<=0) return false;

   double h=iHigh(Symbol(),InpSignalTF,1);
   double l=iLow(Symbol(), InpSignalTF,1);
   double o=iOpen(Symbol(),InpSignalTF,1);
   double c=iClose(Symbol(),InpSignalTF,1);

   double r=(h-l);
   if(r<=0) return false;

   if(r < atr*0.75) return false;

   buyOut = (c>o);
   return true;
}

bool OneEntryPerClosedBarOK()
{
   static datetime lastBar=0;
   datetime t=iTime(Symbol(),InpSignalTF,1);
   if(t==0) return false;
   if(t==lastBar) return false;
   lastBar=t;
   return true;
}

bool OnePhaseSignalPerClosedBarOK()
{
   static datetime lastPhaseBar=0;
   datetime t=iTime(Symbol(),InpSignalTF,1);
   if(t==0) return false;
   if(t==lastPhaseBar) return false;
   lastPhaseBar=t;
   return true;
}

void TryAnchorEntry()
{
   if(CountOpenEA()>0) { g_mode="IN CAMPAIGN"; return; }
   if(!OneEntryPerClosedBarOK()) { g_mode="WAIT: one per closed bar"; return; }

   int zz=ZigZagTrend();
   if(zz==0) { g_mode="WAIT: no ZZ direction"; return; }

   bool expBuy=false;
   if(!ExpansionCandle(expBuy)) { g_mode="WAIT: no expansion candle"; return; }

   bool buy = (zz==1);

   if(!EMAFilterOK(buy)) { g_mode="WAIT: EMA filter"; return; }
   if(!RSIConfirmOK(buy)) { g_mode="WAIT: RSI confirm"; return; }

   double sl=BuildSL(buy);
   double lot = (InpLotMode_UseFixedLot==1) ? NormalizeLot(InpFixedBaseLot) : CalcLot_Risk(sl,buy);
   if(lot<=0) { g_mode="WAIT: lot=0"; return; }

   int t=OpenOrder(lot,buy,sl,"HT_ANCHOR");
   if(t>0)
   {
      StartCampaign(buy,lot);
      g_mode = buy ? "BUY CAMPAIGN" : "SELL CAMPAIGN";
      g_action = buy ? "ENTER BUY ANCHOR" : "ENTER SELL ANCHOR";
   }
   else g_mode="WAIT: OrderSend failed "+IntegerToString(GetLastError());
}

//============================ V6: ROOT CLAMP ==============================//
double RootDistancePts()
{
   if(g_rootAnchorPrice<=0) return 0;
   double price = (g_dir==1 ? Bid : Ask);
   return MathAbs(price - g_rootAnchorPrice)/Point;
}

bool RootClampOK()
{
   if(InpMaxLadderExtensionPts<=0) return true;
   return (RootDistancePts() <= (double)InpMaxLadderExtensionPts);
}

//============================ V6: ACCEL STATE ==============================//
bool AccelActive()
{
   if(!InpAccel_Enable) return false;
   if(g_dir==0) return false;

   // need remaining DER
   if(RemainingPct() < InpAccel_RemainingDER_Min) return false;

   // need confirmation filters still agree
   bool buy = (g_dir==1);
   if(!EMAFilterOK(buy)) return false;
   if(!RSIConfirmOK(buy)) return false;

   // only accelerate if we are still within root clamp
   if(!RootClampOK()) return false;

   return true;
}

int AddsThrottleSeconds()
{
   if(AccelActive()) return MathMax(10, InpAccel_MinSecondsBetweenAdds);
   return MathMax(10, InpMinSecondsBetweenAdds);
}

bool AddThrottleOK()
{
   int secs=AddsThrottleSeconds();
   if(secs<=0) return true;
   if(g_lastAddTime==0) return true;
   return ((TimeCurrent()-g_lastAddTime) >= secs);
}

//============================ Ladder Step / Jump ===========================//
double NextStepPoints()
{
   double rem=g_remaining;
   if(rem<=0) rem = g_DER*0.15;

   double pctMove=TodayMovePct();

   double minPct=InpLadderMinStepPctLeft;
   double maxPct=InpLadderMaxStepPctLeft;

   if(pctMove >= InpDER_HeavyZonePct && pctMove < InpDER_ExhaustionPct)
   {
      minPct *= 0.75;
      maxPct *= 0.85;
   }

   double step = rem * MathMax(0.03, MathMin(maxPct, minPct + (0.12*(1.0-RemainingPct()))));
   double minStepPts = MathMax(30.0, g_DER*0.01);
   double maxStepPts = MathMax(minStepPts, g_DER*0.15);

   step = MathMax(minStepPts, MathMin(step, maxStepPts));

   // V6 accel: tighten steps
   if(AccelActive())
      step *= ClampD(InpAccel_StepFactor, 0.25, 1.0);

   return step;
}

double MoveFromAnchorPts()
{
   if(g_anchorPrice<=0) return 0;
   if(g_dir== 1) return (Bid - g_anchorPrice)/Point;
   if(g_dir==-1) return (g_anchorPrice - Ask)/Point;
   return 0;
}

double LadderJump()
{
   double j = (InpAdaptive_Enable ? g_jumpRuntime : InpLadderLotIncrement_Legacy);
   if(AccelActive()) j *= ClampD(InpAccel_JumpMult, 1.0, 3.0);
   return j;
}

double BuildLadderLot()
{
   double lot = g_baseLot + (g_adds * LadderJump());
   return NormalizeLot(lot);
}

//============================ Ladder Reclaim Engine ========================//
void ReclaimStore(double price,double lot,int dir)
{
   if(!InpReclaim_Enable) return;

   int maxS = MathMax(1, MathMin(InpReclaim_MaxStored, 200));
   if(g_reclaimCount >= maxS)
   {
      for(int i=1;i<g_reclaimCount;i++)
      {
         g_reclaimPrice[i-1]=g_reclaimPrice[i];
         g_reclaimLot[i-1]=g_reclaimLot[i];
         g_reclaimDir[i-1]=g_reclaimDir[i];
         g_reclaimStoredAt[i-1]=g_reclaimStoredAt[i];
      }
      g_reclaimCount = maxS-1;
   }

   g_reclaimPrice[g_reclaimCount]=price;
   g_reclaimLot[g_reclaimCount]=lot;
   g_reclaimDir[g_reclaimCount]=dir;
   g_reclaimStoredAt[g_reclaimCount]=TimeCurrent();
   g_reclaimCount++;

   WisdoWrite("STATE","INFO",0,lot,price,"HT_RECLAIM_STORE");
}

bool ReclaimThrottleOK()
{
   if(InpReclaim_MinSecondsBetweenTries<=0) return true;
   if(g_lastReclaimTry==0) return true;
   return ((TimeCurrent()-g_lastReclaimTry) >= InpReclaim_MinSecondsBetweenTries);
}

void TryReclaimLostLadder()
{
   if(!InpReclaim_Enable) return;
   if(g_dir==0) return;
   if(g_reclaimCount<=0) return;
   if(!ReclaimThrottleOK()) return;

   if(CountOpenEA()<=0) return;
   if(g_ladderLocked) return;

   bool buy=(g_dir==1);
   if(InpReclaim_RequireEMA_RSI)
   {
      if(!EMAFilterOK(buy)) return;
      if(!RSIConfirmOK(buy)) return;
   }

   if(!RootClampOK()) return; // V6 clamp

   int tol = MathMax(5, InpReclaim_TolerancePts);
   double priceNow = buy ? Ask : Bid;

   int best=-1;
   double bestDist=1e10;

   for(int i=0;i<g_reclaimCount;i++)
   {
      if(g_reclaimDir[i]!=g_dir) continue;

      double d = MathAbs(priceNow - g_reclaimPrice[i]) / Point;
      if(d < bestDist)
      {
         bestDist=d;
         best=i;
      }
   }

   if(best<0) return;
   if(bestDist > tol) return;

   if(g_adds >= g_maxAddsRuntime) return;

   double lot = NormalizeLot(g_reclaimLot[best]);
   if(lot<=0) lot = BuildLadderLot();

   double sl = BuildSL(buy);

   int t=OpenOrder(lot,buy,sl,"HT_LADDER_RECLAIM");
   if(t>0)
   {
      g_adds++;
      g_lastAddTime=TimeCurrent();
      g_lastReclaimTry=TimeCurrent();

      g_action="RECLAIM: re-enter ladder @"+DoubleToString(g_reclaimPrice[best],Digits)+" (distPts="+DoubleToString(bestDist,0)+")";

      for(int j=best+1;j<g_reclaimCount;j++)
      {
         g_reclaimPrice[j-1]=g_reclaimPrice[j];
         g_reclaimLot[j-1]=g_reclaimLot[j];
         g_reclaimDir[j-1]=g_reclaimDir[j];
         g_reclaimStoredAt[j-1]=g_reclaimStoredAt[j];
      }
      g_reclaimCount--;
   }
}

//============================ PROTECTION (Non-anchor wipe) =================//
double AnchorFloatingAgainstPts()
{
   if(g_anchorPrice<=0 || g_dir==0) return 0;
   if(g_dir== 1) return MathMax(0.0, (g_anchorPrice-Ask)/Point);
   if(g_dir==-1) return MathMax(0.0, (Bid-g_anchorPrice)/Point);
   return 0;
}

void SetReclaimLine()
{
   if(g_dir== 1) g_reclaimLine = g_lastHigh;
   if(g_dir==-1) g_reclaimLine = g_lastLow;
   if(g_reclaimLine<=0) g_reclaimLine = g_anchorPrice;
}

bool ReclaimConfirmed()
{
   if(!g_ladderLocked) return false;
   if(g_reclaimLine<=0) return false;
   double buf = (MarketInfo(Symbol(),MODE_SPREAD)+10)*Point;

   double c=iClose(Symbol(),InpSignalTF,1);
   if(g_dir== 1) return (c > g_reclaimLine + buf);
   if(g_dir==-1) return (c < g_reclaimLine - buf);
   return false;
}

void ProtectLadder()
{
   if(!InpProtect_Enable) return;
   if(g_dir==0) return;
   if(CountOpenEA()<=0) return;

   bool flip=false;
   if(InpProtect_UseStructureFlip) flip = StructureFlipAgainst(g_dir);
   bool tri = TriangleBreakAgainstDir(g_dir);
   bool hard = (AnchorFloatingAgainstPts() >= InpProtect_MaxAgainstPts);

   if(flip || tri || hard)
   {
      CloseLaddersOnly("HT_PROTECT_WIPE_LADDERS");
      g_ladderLocked=true;
      SetReclaimLine();

      g_adds = 0;
      g_lastAddTime=TimeCurrent();

      string why = (hard?"HARD_AGAINST":(flip?"STRUCT_FLIP":"TRI_BREAK"));
      g_action="PROTECT: wipe ladders ("+why+"), lock until reclaim";
      WisdoWrite("STATE","INFO",0,0,g_reclaimLine,"HT_PROTECT_WIPE_"+why);
   }
}

//============================ CLOSED HISTORY -> RECLAIM ====================//
void ScanHistoryForLostLadders()
{
   if(!InpReclaim_Enable) return;

   int total = OrdersHistoryTotal();
   if(total<=0) return;

   for(int i=total-1; i>=0; i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_HISTORY)) continue;
      if(OrderSymbol()!=Symbol()) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA) continue;

      datetime ct = OrderCloseTime();
      if(ct<=0) continue;
      if(g_lastHistoryScan!=0 && ct<=g_lastHistoryScan) break;

      string cmt = OrderComment();
      if(!IsLadder(cmt)) continue;

      double profit = OrderProfit()+OrderSwap()+OrderCommission();
      if(profit < 0.0)
      {
         int type=OrderType();
         if(type==OP_BUY || type==OP_SELL)
         {
            int d = (type==OP_BUY ? 1 : -1);
            double op = OrderOpenPrice();
            double lot = OrderLots();
            ReclaimStore(op, lot, d);
         }
      }
   }

   datetime newest=0;
   for(int j=total-1; j>=0; j--)
   {
      if(!OrderSelect(j,SELECT_BY_POS,MODE_HISTORY)) continue;
      if(OrderSymbol()!=Symbol()) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA) continue;
      if(OrderCloseTime()>newest) newest=OrderCloseTime();
   }
   if(newest>0) g_lastHistoryScan=newest;
}

//============================ V6: QUANTUM LEAP HOLD =======================//
bool MoveSLToBreakevenAll(int bufferPts)
{
   bool any=false;
   for(int i=OrdersTotal()-1;i>=0;i--)
   {
      if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES)) continue;
      if(OrderMagicNumber()!=InpMagicNumber_ForThisEA || OrderSymbol()!=Symbol()) continue;

      int type=OrderType();
      if(type!=OP_BUY && type!=OP_SELL) continue;

      double op=OrderOpenPrice();
      double sl=OrderStopLoss();
      double tp=OrderTakeProfit();

      if(type==OP_BUY)
      {
         double newSL = op + bufferPts*Point;
         if(Bid <= newSL + (MarketInfo(Symbol(),MODE_SPREAD)+5)*Point) continue;
         if(sl < newSL)
         {
            if(OrderModify(OrderTicket(), op, newSL, tp, 0, clrNONE)) any=true;
         }
      }
      else
      {
         double newSL = op - bufferPts*Point;
         if(Ask >= newSL - (MarketInfo(Symbol(),MODE_SPREAD)+5)*Point) continue;
         if(sl==0 || sl > newSL)
         {
            if(OrderModify(OrderTicket(), op, newSL, tp, 0, clrNONE)) any=true;
         }
      }
   }
   return any;
}

void QuantumLeapCheck()
{
   if(!InpQuantumLeap_Enable) return;
   if(g_dir==0) return;
   if(CountOpenEA()<=0) return;
   if(g_quantumHold) return;

   double moved = MoveFromAnchorPts();
   if(moved >= (double)InpQuantumLeap_Pts)
   {
      // lock SL to BE+buffer and hold
      MoveSLToBreakevenAll(MathMax(0,InpQuantumLeap_BEBufferPts));
      g_quantumHold=true;

      g_action="QUANTUM LEAP HOLD: moved "+DoubleToString(moved,0)+" pts, SL->BE+";
      WisdoWrite("STATE","INFO",0,0,moved,"HT_QUANTUM_HOLD_ON");
   }
}

//============================ LADDER ADD LOGIC =============================//
void TryLadderAdd()
{
   if(g_dir==0) return;

   // V6: clamp ladders near original entry
   if(!RootClampOK())
   {
      g_ladderLocked=true;
      g_action="ROOT CLAMP: no ladders >"+IntegerToString(InpMaxLadderExtensionPts)+" pts from root";
      WisdoWrite("STATE","INFO",0,0,RootDistancePts(),"HT_ROOT_CLAMP_LOCK");
      return;
   }

   if(g_quantumHold && InpQuantumLeap_HoldStopsAdds)
   {
      g_mode="HOLD: Quantum Leap";
      return;
   }

   if(g_ladderLocked)
   {
      if(ReclaimConfirmed())
      {
         g_ladderLocked=false;
         g_action="LADDER UNLOCK: reclaim confirmed";
         WisdoWrite("STATE","INFO",0,0,g_reclaimLine,"HT_LADDER_UNLOCK_RECLAIM");
      }
      return;
   }

   if(TodayMovePct() >= InpDER_ExhaustionPct)
   {
      g_ladderLocked=true;
      SetReclaimLine();
      g_action="LADDER LOCK: exhaustion zone";
      WisdoWrite("STATE","INFO",0,0,g_reclaimLine,"HT_LADDER_LOCK_EXHAUSTION");
      return;
   }

   if(!AddThrottleOK()) return;
   if(g_adds >= g_maxAddsRuntime) return;
   if(g_remaining <= (g_DER*0.04)) return;

   bool buy=(g_dir==1);
   if(!EMAFilterOK(buy)) return;
   if(!RSIConfirmOK(buy)) return;

   double moved = MoveFromAnchorPts();
   if(moved <= 0) return;

   double need = NextStepPoints() * (g_adds+1);
   if(moved < need) return;

   double sl=BuildSL(buy);
   double lot=BuildLadderLot();
   if(lot<=0) return;

   int t=OpenOrder(lot,buy,sl,"HT_LADDER");
   if(t>0)
   {
      g_adds++;
      g_lastAddTime=TimeCurrent();
      g_action="LADDER ADD #"+IntegerToString(g_adds)+" needPts="+DoubleToString(need,0)+" rem="+DoubleToString(g_remaining,0);
   }
}

//============================ V6: PHASE-2 LADDER ==========================//
bool Phase2SignalSameDir()
{
   if(!InpPhase2_Enable) return false;
   if(g_dir==0) return false;
   if(CountOpenEA()<=0) return false;

   if(RemainingPct() < InpPhase2_MinRemainingDER) return false;
   if(!OnePhaseSignalPerClosedBarOK()) return false;

   int zz=ZigZagTrend();
   if(zz==0) return false;

   bool expBuy=false;
   if(!ExpansionCandle(expBuy)) return false;

   bool wantBuy = (g_dir==1);
   if(wantBuy && zz!=1) return false;
   if(!wantBuy && zz!=-1) return false;

   if(!EMAFilterOK(wantBuy)) return false;
   if(!RSIConfirmOK(wantBuy)) return false;

   return true;
}

void StartNextPhase()
{
   if(!InpPhase2_Enable) return;
   if(g_dir==0) return;

   if(g_phaseCount >= InpPhase2_MaxPhases) return;
   if((TimeCurrent()-g_lastPhaseTime) < InpPhase2_MinSecondsBetweenPhases) return;
   if(RemainingPct() < InpPhase2_MinRemainingDER) return;

   // keep phase anchor close to ROOT anchor too (same clamp rule)
   if(!RootClampOK()) return;

   // Reset phase ladder state but keep campaign start/target
   g_anchorPrice = (g_dir==1 ? Ask : Bid);
   g_adds=0;
   g_lastAddTime=0;
   g_ladderLocked=false;
   g_quantumHold=false;

   g_phase++;
   g_phaseCount++;
   g_lastPhaseTime=TimeCurrent();

   g_action="PHASE-"+IntegerToString(g_phaseCount)+": re-ladder signal confirmed";
   WisdoWrite("STATE","INFO",0,0,g_anchorPrice,"HT_PHASE2_START");
}

//============================ CAPTURE (Target reached) =====================//
void CaptureIfTarget()
{
   if(!CampaignTargetHit()) return;

   CloseAll("HT_CAPTURE_TARGET_HIT");
   g_captures++;
   SaveCaptures();
   AdaptiveOnWin();

   g_action="CAPTURE: Target hit (captures="+IntegerToString(g_captures)+")";
   WisdoWrite("STATE","INFO",0,0,AccountEquity(),"HT_CAPTURE_TARGET_HIT");

   if(InpDailyIdle_Enable && InpDailyIdle_RestOfDay)
   {
    g_dailyIdleToday=true;
g_dailyIdleDayStart=g_dayStart;

// resume next day at 4 AM (V7)
g_dailyIdleUntil = NextResumeTime();
      WisdoWrite("STATE","INFO",0,0,0,"HT_DAILY_IDLE_ON_REST_OF_DAY");
   }

   ResetCampaign();
}

//============================ LOSS FEEDBACK (Campaign ended) ===============//
void DetectCampaignEndLoss()
{
   if(!g_campaignLive) return;
   if(CountOpenEA()>0) return;

   double eq = AccountEquity();
   if(eq<=0) eq = AccountBalance();

   if(eq < (g_campaignStartEqSnapshot - 0.01))
   {
      AdaptiveOnLoss();
      g_action="CAMPAIGN LOSS: adaptive compression applied";
      WisdoWrite("STATE","INFO",0,0,eq,"HT_CAMPAIGN_LOSS_COMPRESS");
   }

   g_campaignLive=false;
   g_campaignStartEqSnapshot=0;
}

//============================ V6: MANUAL CLOSE RESPECT ====================//
void ManualCloseRespectCheck()
{
   if(!InpRespectManualClose) { g_prevOpenCount=CountOpenEA(); return; }

   int nowCount = CountOpenEA();

   // Manual close detected: had orders, now none, and EA wasn't closing them for a known reason
   if(g_prevOpenCount>0 && nowCount==0)
   {
      // If last EA close reason is empty, assume manual intervention
      // (EA driven closes always set g_lastEACloseReason in CloseTicket())
      bool likelyManual = (StringLen(g_lastEACloseReason)==0);

      if(likelyManual)
      {
         g_manualPauseUntil = TimeCurrent() + MathMax(1,InpManualCloseCooldownMinutes)*60;
         g_action="MANUAL CLOSE DETECTED: pausing "+IntegerToString(InpManualCloseCooldownMinutes)+"m";
         WisdoWrite("STATE","INFO",0,0,0,"HT_MANUAL_CLOSE_PAUSE");

         ResetCampaign(); // end campaign safely so it won't re-enter instantly
      }

      // clear reason after transition
      g_lastEACloseReason="";
   }

   g_prevOpenCount = nowCount;
}

bool ManualPauseActive()
{
   if(!InpRespectManualClose) return false;
   if(g_manualPauseUntil==0) return false;
   return (TimeCurrent() < g_manualPauseUntil);
}

//============================ THEMES / RANKS ===============================//
string RankNameByCaptures(int c)
{
   if(c>=10) return "MYTHIC";
   if(c>=5)  return "HIGHTOWER";
   if(c>=3)  return "DOMINION";
   if(c>=1)  return "ASCENDANT";
   return "INITIATE";
}

void ApplyThemeByRank(string rank)
{
   if(rank=="INITIATE")
   { gThemeBG=clrBlack; gThemeAccent=clrDodgerBlue; gThemeBull=clrLime; gThemeBear=clrTomato; gThemeText=clrWhite; }
   else if(rank=="ASCENDANT")
   { gThemeBG=clrBlack; gThemeAccent=clrAqua; gThemeBull=clrAqua; gThemeBear=clrDeepPink; gThemeText=clrWhite; }
   else if(rank=="DOMINION")
   { gThemeBG=clrBlack; gThemeAccent=clrCrimson; gThemeBull=clrGold; gThemeBear=clrRed; gThemeText=clrWhite; }
   else if(rank=="HIGHTOWER")
   { gThemeBG=clrBlack; gThemeAccent=clrMediumPurple; gThemeBull=clrLime; gThemeBear=clrOrangeRed; gThemeText=clrWhite; }
   else
   { gThemeBG=clrBlack; gThemeAccent=clrMagenta; gThemeBull=clrMagenta; gThemeBear=clrGold; gThemeText=clrWhite; }

   ChartSetInteger(0,CHART_COLOR_BACKGROUND,gThemeBG);
   ChartSetInteger(0,CHART_COLOR_FOREGROUND,gThemeText);
   ChartSetInteger(0,CHART_COLOR_GRID,clrNONE);
   ChartSetInteger(0,CHART_SHOW_GRID,false);

   ChartSetInteger(0,CHART_COLOR_CANDLE_BULL,gThemeBull);
   ChartSetInteger(0,CHART_COLOR_CANDLE_BEAR,gThemeBear);
   ChartSetInteger(0,CHART_COLOR_CHART_UP,gThemeBull);
   ChartSetInteger(0,CHART_COLOR_CHART_DOWN,gThemeBear);
}

//============================ DASHBOARD ===================================//
void EnsureRect(string name,int x,int y,int w,int h,color bg,int z)
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
string Pct(double x){ return DoubleToString(x*100.0,1)+"%"; }

void DrawDash()
{
   if(!InpDashboard) return;

   int x=InpDashX, y=InpDashY;
   int W=930, H=360;

   string rank=RankNameByCaptures(g_captures);

   EnsureRect("HT_PANEL",x,y,W,H,gThemeBG,200);
   EnsureRect("HT_STRIP",x,y,W,18,gThemeAccent,201);

   EnsureLabel("HT_HEAD",x+8,y+2,
      "DF HIGHTOWER V7 | "+rank+
      " | "+g_tierName+
      " | Captures="+IntegerToString(g_captures)+
      " | DailyIdle="+(g_dailyIdleToday?"ON":"OFF")+"("+IntegerToString(InpDailyIdleResumeHour)+":00)"+
      " | ManualPause="+(ManualPauseActive()?"ON":"OFF"),
      10,gThemeBG,205);

   string derLine = "DER="+DoubleToString(g_DER,0)+" pts"
                    +" | MoveToday="+DoubleToString(g_todayMove,0)+" ("+Pct(TodayMovePct())+")"
                    +" | Remaining="+DoubleToString(g_remaining,0)+" ("+Pct(RemainingPct())+")";

   string adaptLine =
      "ADAPT: Jump="+DoubleToString(g_jumpRuntime,2)+
      " | MaxAdds="+IntegerToString(g_maxAddsRuntime)+
      " | SL(ATR)="+DoubleToString(g_atrMultRuntime,2)+
      " +Buf="+IntegerToString(g_slBufRuntimePts)+
      " | W/L Today="+IntegerToString(g_winsToday)+"/"+IntegerToString(g_lossesToday);

   string campLine="Campaign: "+(g_dir==0?"NONE":(g_dir==1?"BUY":"SELL"))
                   +" | Root="+(g_rootAnchorPrice>0?DoubleToString(g_rootAnchorPrice,Digits):"0")
                   +" | PhaseAnchor="+(g_anchorPrice>0?DoubleToString(g_anchorPrice,Digits):"0")
                   +" | Adds="+IntegerToString(g_adds)+"/"+IntegerToString(g_maxAddsRuntime);

   string v6Line="V7: RootDist="+DoubleToString(RootDistancePts(),0)+" / "+IntegerToString(InpMaxLadderExtensionPts)
                 +" | Accel="+(AccelActive()?"ON":"OFF")
                 +" | Phase="+IntegerToString(g_phaseCount)+"/"+IntegerToString(InpPhase2_MaxPhases)
                 +" | QHold="+(g_quantumHold?"ON":"OFF")
                 +" | SmallCap="+(IsSmallCap()?"YES":"NO");

   double eq=AccountEquity();
   string targetLine="Equity="+DoubleToString(eq,2)
                     +" | Start="+DoubleToString(g_campaignStartEquity,2)
                     +" | Target="+DoubleToString(g_campaignTargetEquity,2)
                     +" | FloatP="+DoubleToString(FloatingProfitEA(),2);

   EnsureLabel("HT_L1",x+10,y+30,derLine,9,gThemeText,205);
   EnsureLabel("HT_L2",x+10,y+48,adaptLine,9,gThemeAccent,205);
   EnsureLabel("HT_L3",x+10,y+70,campLine,9,gThemeText,205);
   EnsureLabel("HT_L4",x+10,y+88,v6Line,9,gThemeText,205);
   EnsureLabel("HT_L5",x+10,y+108,targetLine,9,gThemeText,205);
   EnsureLabel("HT_L6",x+10,y+134,"MODE: "+g_mode,9,gThemeText,205);
   EnsureLabel("HT_L7",x+10,y+152,"ACTION: "+g_action,9,gThemeText,205);
   // V7: Equity sparkline graph
   DrawEquityGraph();
}

void EnsureSessionBaseline()
{
   datetime ss = SessionStartToday();

   // If we're before 3am, we are still in "pre-session" time. Don't set baseline yet.
   if(TimeCurrent() < ss) return;

   // If baseline already set for today (same session start timestamp), do nothing
   if(g_sessionStartTime == ss && g_sessionStartEquity > 0) return;

   // New session baseline
   g_sessionStartTime   = ss;
   g_sessionStartEquity = AccountEquity();
   if(g_sessionStartEquity <= 0) g_sessionStartEquity = AccountBalance();

   SaveSessionStartTime(g_sessionStartTime);
   SaveSessionStartEquity(g_sessionStartEquity);
}
bool VictoryLockHit()
{
   if(!InpVictoryLock_Enable) return false;
   if(g_sessionStartEquity <= 0) return false;

   double eq = AccountEquity();
   if(eq <= 0) eq = AccountBalance();

   double target = g_sessionStartEquity * (1.0 + InpVictoryLock_GainPct/100.0);
   return (eq >= target);
}

void TriggerVictoryLock(string why)
{
   if(InpVictoryLock_CloseAll && CountOpenEA() > 0)
      CloseAll("HT_VICTORY_LOCK_"+why);

   g_dailyIdleToday = true;
   g_dailyIdleUntil = NextResumeTime(); // should be next 03:00
   SaveIdleUntil(g_dailyIdleUntil);

   WisdoWrite("STATE","INFO",0,0,(double)g_dailyIdleUntil,"HT_VICTORY_LOCK_"+why);
   g_action = "VICTORY LOCK: "+why+" | idle until "+TimeToString(g_dailyIdleUntil, TIME_MINUTES);

   ResetCampaign();
}
//============================ INIT / DEINIT / TICK ========================//
int OnInit()
{


   if(InpNoGrid)
   {
      ChartSetInteger(0,CHART_SHOW_GRID,false);
      ChartSetInteger(0,CHART_COLOR_GRID,clrNONE);
   }

   EqGraphReset();
   g_captures = LoadCaptures();

   ResetCampaign();
   UpdateDER();
   UpdateStructureFromZigZag();
   EqGraphSample();
   // restore idle lock if terminal restarted
datetime savedIdle = LoadIdleUntil();
if(savedIdle > TimeCurrent())
{
   g_dailyIdleToday = true;
   g_dailyIdleUntil = savedIdle;
}

// restore session baseline
g_sessionStartEquity = LoadSessionStartEquity();
g_sessionStartTime   = LoadSessionStartTime();
   g_dayStartBalance=0;
   ApplyDayTierLock(true);

   string rank=RankNameByCaptures(g_captures);
   ApplyThemeByRank(rank);

   g_mode="HUNTING";
   g_action="INIT_OK_V7";

   g_lastHistoryScan=0;
   g_reclaimCount=0;
   g_lastReclaimTry=0;

   g_prevOpenCount=CountOpenEA();
   g_manualPauseUntil=0;
   g_lastEACloseReason="";

   WisdoWrite("STATE","INFO",0,0,0,"HT_INIT_OK_V7");
   return(INIT_SUCCEEDED);
}
input int    InpDailyIdleResumeHour = 4;   // V7: resume trading at 4:00 broker time
input double InpMaxLotCap            = 25;  // V7: safety cap on any single order lot
input int    InpEquityGraphPoints    = 120; // V7: number of points in equity sparkline
input int    InpEquityGraphStepSec   = 60;  // V7: sampling period (seconds)

void OnDeinit(const int reason)
{
   string names[]={"HT_PANEL","HT_STRIP","HT_HEAD","HT_L1","HT_L2","HT_L3","HT_L4","HT_L5","HT_L6","HT_L7","HT_EQ_TXT","HT_EQ_POLY"};
   for(int i=0;i<ArraySize(names);i++) ObjectDelete(0,names[i]);
   WisdoWrite("STATE","INFO",0,0,0,"HT_DEINIT_"+IntegerToString(reason));
}

void OnTick()
{
   if(Bars<300) return;

   UpdateDER();
   UpdateStructureFromZigZag();
   EqGraphSample();
// 0) HARD SESSION GATE: no trading before 03:00 broker time
if(InpSessionGate_Enable && BeforeSessionStartNow())
{
   g_mode   = "SESSION WAIT";
   g_action = "Hard cap: waiting for "+IntegerToString(InpSessionStartHour)+":00 broker time";
   DrawDash();
   return;
}

// lock baseline once session opens (>=03:00)
EnsureSessionBaseline();
   // theme updates
   string rank=RankNameByCaptures(g_captures);
   ApplyThemeByRank(rank);

   // scan history for reclaim
   ScanHistoryForLostLadders();

   // V6: detect manual close transitions
   ManualCloseRespectCheck();

   // 0) Manual pause (after your manual close)
   if(ManualPauseActive())
   {
      g_mode="MANUAL PAUSE";
      g_action="Paused until "+TimeToString(g_manualPauseUntil,TIME_MINUTES);
      DrawDash();
      return;
   }

// 1) DAILY IDLE (rest of day) - persists across midnight and restarts
if(InpDailyIdle_Enable && InpDailyIdle_RestOfDay && g_dailyIdleToday && g_dailyIdleUntil > 0)
{
   if(TimeCurrent() < g_dailyIdleUntil)
   {
      g_mode   = "DAILY IDLE";
      g_action = "NO TRADES UNTIL " + TimeToString(g_dailyIdleUntil, TIME_MINUTES);
      DrawDash();
      return;
   }
   else
   {
      g_dailyIdleToday = false;
      g_dailyIdleUntil = 0;
      SaveIdleUntil(0);
   }
}
   // 2) Perfect Collect (small capital assist)
   //    - If small cap: ALWAYS obey Perfect Collect.
   //    - If not small cap: still enabled, but this is a softer "build-mode" exit.
   if(PerfectCollectHit())
   {
      DoPerfectCollect(IsSmallCap()?"SMALLCAP":"STANDARD");
      DrawDash();
      return;
   }
// 2) VICTORY LOCK (equity-based "one win per day")
if(VictoryLockHit())
{
   TriggerVictoryLock("GAIN_"+DoubleToString(InpVictoryLock_GainPct,0)+"pct");
   DrawDash();
   return;
}
   // 3) Capture if doctrine target reached
   if(CountOpenEA()>0) CaptureIfTarget();

   // 4) Quantum leap hold check
   QuantumLeapCheck();

   // 5) Detect campaign end loss (if ended without capture/perfect collect)
   DetectCampaignEndLoss();

   // 6) Hunt or manage campaign
   if(CountOpenEA()==0)
   {
      g_mode="HUNTING";
      TryAnchorEntry();
   }
   else
   {
      // V6 phase-2: if new same-dir signal appears and DER says more to collect
      if(Phase2SignalSameDir())
         StartNextPhase();

      ProtectLadder();
      TryReclaimLostLadder();
      TryLadderAdd();

      g_mode = (g_dir==0 ? "UNKNOWN" : (g_dir==1 ? "BUY CAMPAIGN" : "SELL CAMPAIGN"));
   }

   DrawDash();
}
//+------------------------------------------------------------------+
