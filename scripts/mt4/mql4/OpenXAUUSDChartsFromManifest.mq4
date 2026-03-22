#property strict

input string InpSymbol = "XAUUSD";
input ENUM_TIMEFRAMES InpTimeframe = PERIOD_M15;
input string InpManifestFile = "xauusd-ea-templates.csv";
input int InpMaxCharts = 50;
input bool InpCloseTaggedChartsFirst = true;
input string InpTagPrefix = "DFXAU";
input int InpOpenDelayMs = 120;

string NormalizeLabel(string v)
{
   string out = v;
   StringReplace(out, "\\", "_");
   StringReplace(out, "/", "_");
   StringReplace(out, " ", "_");
   StringReplace(out, ":", "_");
   StringReplace(out, ".", "_");
   StringReplace(out, "(", "_");
   StringReplace(out, ")", "_");
   StringReplace(out, "+", "_");
   StringReplace(out, "-", "_");
   return out;
}

string TagNameFor(string botLabel)
{
   return InpTagPrefix + "_" + NormalizeLabel(botLabel);
}

bool IsTaggedChart(long chartId, string botLabel)
{
   string tag = TagNameFor(botLabel);
   return (ObjectFind(chartId, tag) >= 0);
}

void PlaceChartTag(long chartId, string botLabel, string templateFile)
{
   string tag = TagNameFor(botLabel);
   if(ObjectFind(chartId, tag) >= 0)
      ObjectDelete(chartId, tag);

   if(!ObjectCreate(chartId, tag, OBJ_LABEL, 0, 0, 0))
      return;

   string txt = "BOT=" + botLabel + " | TEMPLATE=" + templateFile;
   ObjectSetString(chartId, tag, OBJPROP_TEXT, txt);
   ObjectSetInteger(chartId, tag, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(chartId, tag, OBJPROP_XDISTANCE, 10);
   ObjectSetInteger(chartId, tag, OBJPROP_YDISTANCE, 16);
   ObjectSetInteger(chartId, tag, OBJPROP_COLOR, clrSilver);
   ObjectSetInteger(chartId, tag, OBJPROP_HIDDEN, true);
}

bool AlreadyOpenedForBot(string botLabel)
{
   long chartId = ChartFirst();
   while(chartId >= 0)
   {
      if(ChartSymbol(chartId) == InpSymbol && IsTaggedChart(chartId, botLabel))
         return true;
      chartId = ChartNext(chartId);
   }
   return false;
}

void CloseTaggedCharts()
{
   long ids[512];
   int n = 0;

   long chartId = ChartFirst();
   while(chartId >= 0 && n < 512)
   {
      int objs = ObjectsTotal(chartId);
      bool tagged = false;
      for(int i = objs - 1; i >= 0; i--)
      {
         string objName = ObjectName(chartId, i);
         if(StringFind(objName, InpTagPrefix + "_") == 0)
         {
            tagged = true;
            break;
         }
      }

      if(tagged)
      {
         ids[n] = chartId;
         n++;
      }
      chartId = ChartNext(chartId);
   }

   for(int k = 0; k < n; k++)
      ChartClose(ids[k]);
}

void OnStart()
{
   if(InpCloseTaggedChartsFirst)
      CloseTaggedCharts();

   int h = FileOpen(InpManifestFile, FILE_CSV | FILE_READ | FILE_COMMON, ',');
   if(h == INVALID_HANDLE)
   {
      Print("Manifest not found in Common\\Files: ", InpManifestFile);
      return;
   }

   string c1 = FileReadString(h);
   string c2 = FileReadString(h);
   string c3 = FileReadString(h);
   string c4 = FileReadString(h);

   int opened = 0;
   int skippedExisting = 0;
   int skippedDisabled = 0;
   int failed = 0;

   while(!FileIsEnding(h))
   {
      string enabledStr = FileReadString(h);
      if(enabledStr == "")
         break;

      string templateFile = FileReadString(h);
      string botLabel = FileReadString(h);
      string expertRel = FileReadString(h);

      int enabled = (int)StrToInteger(enabledStr);
      if(enabled == 0)
      {
         skippedDisabled++;
         continue;
      }

      if(AlreadyOpenedForBot(botLabel))
      {
         skippedExisting++;
         continue;
      }

      if(opened >= InpMaxCharts)
      {
         Print("Reached InpMaxCharts cap: ", InpMaxCharts);
         break;
      }

      long chartId = ChartOpen(InpSymbol, InpTimeframe);
      if(chartId <= 0)
      {
         failed++;
         continue;
      }

      Sleep(InpOpenDelayMs);
      bool applied = ChartApplyTemplate(chartId, templateFile);
      if(!applied)
      {
         failed++;
         Print("Template missing or failed: ", templateFile, " | EA: ", expertRel);
      }

      PlaceChartTag(chartId, botLabel, templateFile);
      opened++;
   }

   FileClose(h);

   Print("OpenXAUUSDChartsFromManifest summary -> opened=", opened,
         " skippedExisting=", skippedExisting,
         " skippedDisabled=", skippedDisabled,
         " failed=", failed);
}
