//+------------------------------------------------------------------+
//|                                              CULTURE COIN V2.mq4 |
//|                                            CEO Derrion Fountain  |
//|                                                                  |
//+------------------------------------------------------------------+
#property strict
//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
//---
   
//---
   return(INIT_SUCCEEDED);
  }
//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
//---
   
  }
//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   
   //High candles 
   
  
   
   //Low Candles 
   
   
  
   
   
   
   if(Close[1] > iHighest(Symbol(),0,MODE_HIGH,50,2))
   //Close[1] > iMA(Symbol(),0,25,1,0,PRICE_CLOSE,0) & Close[2] < iMA(Symbol(),0,25,1,0,PRICE_CLOSE,0))
   {
      OrderSelect(0,SELECT_BY_POS);
      OrderClose(OrderTicket(),1,Bid,100,clrBlack);
      OrderSend(Symbol(),OP_BUY,1.00,Ask,100,0,10,NULL,0,0,clrDarkSeaGreen);
   }
   
     if( Close[1] < iLowest(Symbol(),0,MODE_LOW,50,2))
    // Close[1] < iMA(Symbol(),0,25,1,0,PRICE_CLOSE,0) & Close[2] > iMA(Symbol(),0,25,1,0,PRICE_CLOSE,0) 
   {
      OrderSelect(0,SELECT_BY_POS);
      OrderClose(OrderTicket(),1,Ask,100,clrBlack);
      OrderSend(Symbol(),OP_SELL,1.00,Bid,100,0,10,NULL,0,0,clrDarkSeaGreen);
   }
 
   
  }
//+------------------------------------------------------------------+
