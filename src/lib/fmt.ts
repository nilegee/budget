import { data } from "./store";
import { formatMoney } from "./money";

/** Whole-dirham display by default; pass decimals for exact amounts. */
export const money = (n: number, decimals = false) => formatMoney(n, data.value.settings.currency, { decimals });
