import { getPriceImpact, Quote } from "handle-sdk/dist/components/convert";

const getEstimatedImpact = (quote: Quote | undefined) => {
  if (!quote?.usdValues.valueIn || !quote?.usdValues.valueOut) return 0;
  return (
    getPriceImpact(quote.usdValues.valueIn, quote.usdValues.valueOut) * 100
  );
};

export default getEstimatedImpact;
