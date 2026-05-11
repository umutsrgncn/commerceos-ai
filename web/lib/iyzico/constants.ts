/** iyzico ödeme entegrasyonu için sabitler. */

export const IYZICO_SANDBOX = "https://sandbox-api.iyzipay.com";
export const IYZICO_PRODUCTION = "https://api.iyzipay.com";

/** iyzico'nun yayınladığı public sandbox credentials.
 *  Production'da Settings'ten kullanıcının kendi key'leri okunur. */
export const SANDBOX_API_KEY = "sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI";
export const SANDBOX_SECRET_KEY = "sandbox-wbwpzKIiplZxI3hh5ALI4FJyAcZKL6kQ";

export const IYZICO_TEST_CARDS = [
  { name: "Başarılı (Akbank)", number: "5528790000000008", expiry: "12/30", cvv: "123" },
  { name: "Başarılı (Garanti)", number: "5400360000000003", expiry: "12/30", cvv: "123" },
  { name: "3DS başarılı", number: "5170410000000004", expiry: "12/30", cvv: "123" },
  { name: "Başarısız", number: "4111111111111129", expiry: "12/30", cvv: "123" },
  { name: "Yetersiz bakiye", number: "4127000000000005", expiry: "12/30", cvv: "123" },
];
