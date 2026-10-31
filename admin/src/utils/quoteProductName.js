const firstName = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() || ''

export const getQuoteProductName = (quote, { isArabic, generalInquiry }) => {
  const liveProductName = isArabic
    ? firstName(quote.product?.name_ar, quote.product?.name_en)
    : firstName(quote.product?.name_en, quote.product?.name_ar)

  const snapshotName = isArabic
    ? firstName(quote.product_name_ar_snapshot, quote.product_name_en_snapshot)
    : firstName(quote.product_name_en_snapshot, quote.product_name_ar_snapshot)

  return liveProductName
    || snapshotName
    || firstName(quote.custom_product_name)
    || generalInquiry
}
