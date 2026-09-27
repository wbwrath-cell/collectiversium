# Šablony EmailJS pro objednávkový formulář

Dočasné řešení, než projde platební brána. Formulář `/objednavka.html`
(logika v `js/order-form.js`) posílá přes EmailJS dva e-maily. Šablony se
v EmailJS zakládají ručně (Email Templates → Create New Template), obsah se
vkládá přes **Edit Content → Code Editor**.

## 1. Objednávka pro e-shop — `objednavka-pro-eshop.html`

| Pole v EmailJS | Hodnota |
|---|---|
| Subject | `Nová objednávka {{order_number}}` |
| To Email | `supply@collectiversium.cz` |
| From Name | `Collectiversium – formulář` |
| Reply To | `{{customer_email}}` |

## 2. Potvrzení pro zákazníka — `potvrzeni-pro-zakaznika.html`

| Pole v EmailJS | Hodnota |
|---|---|
| Subject | `Máme vaši objednávku {{order_number}}` |
| To Email | `{{customer_email}}` |
| From Name | `Collectiversium` |
| Reply To | `supply@collectiversium.cz` |

## Proměnné

Posílá je `buildParams()` v `js/order-form.js`. Všechny jsou prostý text
(`{{…}}` je EmailJS escapuje) — nikdy nepoužívat trojité `{{{…}}}`, šablona
je veřejně volatelná a HTML z prohlížeče by do ní šlo podstrčit.

`order_number`, `customer_name`, `customer_email`, `customer_phone`,
`delivery_method`, `delivery_detail`, `items_text`, `items_with_ids`, `total`,
`note`, `consent_at`, `created_at`

## Limity free plánu

- 200 e-mailů měsíčně — každá objednávka jsou 2, tedy ~100 objednávek.
- 1 požadavek za sekundu — proto formulář mezi oběma e-maily čeká.
- 2 šablony — přesně tolik, kolik potřebujeme.
