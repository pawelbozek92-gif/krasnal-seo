/**
 * Netto/brutto display state shared by the pricing cards and the calculator.
 * Any element with data-price-net="<number>" is re-rendered when the mode changes;
 * an optional data-price-suffix is appended (e.g. " / h").
 */
import { site } from '../config/site';
import { formatPLN, toGross } from '../lib/format';

export type VatMode = 'net' | 'gross';
let mode: VatMode = 'net';

export const getVatMode = () => mode;
export const applyVat = (net: number) => (site.vatPayer && mode === 'gross' ? toGross(net, site.vatRate) : net);
export const money = (net: number) => formatPLN(applyVat(net));

export const vatShortLabel = () =>
  !site.vatPayer ? 'zw. z VAT' : mode === 'gross' ? 'brutto' : 'netto';
export const vatLongLabel = () =>
  !site.vatPayer
    ? 'Ceny końcowe – sprzedawca zwolniony z VAT.'
    : mode === 'gross'
      ? `Ceny brutto (zawierają ${Math.round(site.vatRate * 100)}% VAT).`
      : `Ceny netto + ${Math.round(site.vatRate * 100)}% VAT.`;

export function renderPrices(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-price-net]').forEach((el) => {
    el.textContent = money(Number(el.dataset.priceNet)) + (el.dataset.priceSuffix ?? '');
  });
  root.querySelectorAll<HTMLElement>('[data-vat-short]').forEach((el) => (el.textContent = vatShortLabel()));
  root.querySelectorAll<HTMLElement>('[data-vat-long]').forEach((el) => (el.textContent = vatLongLabel()));
}

export function setVatMode(next: VatMode) {
  mode = next;
  renderPrices();
  document.querySelectorAll<HTMLInputElement>('input[name="vat-mode"]').forEach((r) => (r.checked = r.value === next));
  document.dispatchEvent(new CustomEvent('vatchange', { detail: next }));
}
