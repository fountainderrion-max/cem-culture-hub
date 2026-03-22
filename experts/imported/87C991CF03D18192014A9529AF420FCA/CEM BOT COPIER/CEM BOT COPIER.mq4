//+------------------------------------------------------------------+
//| Wisdo_Copier.mq4                                                 |
//| File-based universal copy executor (MT4)                         |
//+------------------------------------------------------------------+
#property strict

//==================== USER CONTROLS (DROPDOWNS ONLY) ===============//

enum COPY_MODE
{
   COPY_OFF = 0,
   COPY_ON  = 1
};

enum LOT_MODE
{
   LOT_FIXED = 0,
   LOT_RISK_PERCENT = 1
};

input COPY_MODE InpCopyMode = COPY_ON;

input LOT_MODE  InpLotMode  = LOT_FIXED;
input double    InpFixedLot = 0.01;     // used if LOT_FIXED
input double    InpRiskPct  = 1.0;      // used if LOT_RISK_PERCENT

input int       InpSlippage = 3;
input int       InpMagic    = 880088;

//==================== INTERNAL STATE ===============================//

string gSubscriberId = "";
string gCopyFile     = "";

string gProcessed[500];
int    gProcessedCount = 0;

//==================== UTILS =======================================//

string GetSubscriberId()
{
   string raw = IntegerToString(AccountNumber()) + "|" + AccountCompany();
   int h = 2166136261;
   for(int i=0;i<StringLen(raw);i++)
   {
      h ^= StringGetChar(raw,i);
      h *= 16777619;
   }
   return "SUB-" + StringFormat("%08X",h);
}

bool IsProcessed(const string line)
{
   for(int i=0;i<gProcessedCount;i++)
      if(gProcessed[i] == line) return true;
   return false;
}

void MarkProcessed(const string line)
{
   if(gProcessedCount < 500)
      gProcessed[gProcessedCount++] = line;
}

//==================== LOT CALC ====================================//

double CalcLot(double entry, double sl)
{
   if(InpLotMode == LOT_FIXED)
      return NormalizeDouble(InpFixedLot,2);

   // Risk % mode
   double riskMoney = AccountBalance() * (InpRiskPct / 100.0);
   double distPts   = MathAbs(entry - sl) / Point;
   if(distPts <= 0) distPts = 100;

   double pipVal = MarketInfo(Symbol(), MODE_TICKVALUE);
   if(pipVal <= 0) pipVal = 1.0;

   double lot = riskMoney / (distPts * pipVal);
   lot = NormalizeDouble(lot,2);

   double minLot = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot = MarketInfo(Symbol(), MODE_MAXLOT);

   if(lot < minLot) lot = minLot;
   if(lot > maxLot) lot = maxLot;

   return lot;
}

//==================== COPY PARSER =================================//

void ProcessCopyFile()
{
   if(InpCopyMode == COPY_OFF) return;

   int fh = FileOpen(gCopyFile, FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI);
   if(fh < 0) return;

   while(!FileIsEnding(fh))
   {
      string line = FileReadString(fh);
      if(StringLen(line) < 20) continue;
      if(IsProcessed(line))    continue;

      // Minimal JSON extraction (safe + simple)
      string sym = "";
      string dir = "";
      double entry = 0;
      double sl = 0;
      double tp = 0;

      int p;

      p = StringFind(line,"\"symbol\":\"");
      if(p>=0) sym = StringSubstr(line,p+10,StringFind(line,"\"",p+10)-(p+10));

      p = StringFind(line,"\"direction\":\"");
      if(p>=0) dir = StringSubstr(line,p+13,StringFind(line,"\"",p+13)-(p+13));

      p = StringFind(line,"\"entry\":");
      if(p>=0) entry = StrToDouble(StringSubstr(line,p+8));

      p = StringFind(line,"\"sl\":");
      if(p>=0) sl = StrToDouble(StringSubstr(line,p+5));

      p = StringFind(line,"\"tp\":");
      if(p>=0) tp = StrToDouble(StringSubstr(line,p+5));

      if(sym != Symbol()) { MarkProcessed(line); continue; }

      bool buy = (dir == "BUY");

      double lot = CalcLot(entry, sl);
      double price = buy ? Ask : Bid;
      int type = buy ? OP_BUY : OP_SELL;

      int tk = OrderSend(Symbol(), type, lot, price,
                         InpSlippage, sl, tp,
                         "WISDO_COPY", InpMagic, 0,
                         buy?clrAqua:clrTomato);

      if(tk > 0)
         MarkProcessed(line);
   }

   FileClose(fh);
}

//==================== MT4 LIFECYCLE ================================//

int OnInit()
{
   gSubscriberId = GetSubscriberId();
   gCopyFile     = "WISDO\\copy\\" + gSubscriberId + ".jsonl";

   Comment(
      "WISDO COPIER\n",
      "Subscriber: ", gSubscriberId, "\n",
      "Mode: ", (InpCopyMode==COPY_ON?"ON":"OFF"), "\n",
      "LotMode: ", (InpLotMode==LOT_FIXED?"FIXED":"RISK%")
   );

   return(INIT_SUCCEEDED);
}

void OnTick()
{
   ProcessCopyFile();
}
//+------------------------------------------------------------------+
