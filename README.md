# Mail Toplayıcı (Chrome uzantısı)

Ziyaret ettiğiniz web sayfalarında görünen e-posta adreslerini toplar, tekrarları birleştirir ve **TXT dosyası** olarak indirmenize olanak verir. İndirmeden önce **alan adına veya son uzantıya (TLD)** göre dahil etme / dışlama yapabilirsiniz.

## Gereksinimler

- **Google Chrome**, **Microsoft Edge**, **Brave** veya Chromium tabanlı bir tarayıcı (Manifest V3 destekleyen sürüm).

## Kurulum (paketlenmemiş)

1. Tarayıcıda adres çubuğuna yazın: `chrome://extensions`  
   (Edge: `edge://extensions`)
2. Sağ üstten **Geliştirici modu**nu açın.
3. **Paketlenmemiş öğe yükle** (veya **Load unpacked**) seçin.
4. Bu klasörü seçin: `email-collector-extension`  
   (içinde `manifest.json` olan dizin).

Uzantı simgesi araç çubuğuna gelmezse, yapboz simgesinden **sabitle**yin.

## Kullanım

1. Araç çubuğundaki uzantı simgesine tıklayın.
2. **Toplamayı aç** kutusunu işaretleyin.  
   Bu açıkken gezindiğiniz sayfalar (iframe’ler dahil) taranır; adresler yerel olarak saklanır.
3. **İndirmede dahil et** bölümünde, toplanan adreslerden çıkan **son uzantı (TLD)** ve **alan adı (@ sonrası)** için kutuları işaretleyin veya kaldırın.  
   - İşaretli = o gruptaki adresler **indirmeye aday**.  
   - İşaretsiz = o gruba uyan adresler **bu indirmede yer almaz** (yalnızca filtre; liste aynı kalır).  
   - Bir adresin indirilmesi için **hem** TLD **hem** alan adı grubunun işaretli olması gerekir (ikisi birden uygulanır).
4. **TXT olarak indir (filtreye uygunlar)** ile yalnızca seçimlerinize uyan adresleri dosyaya alın.
5. İsterseniz **Dışlananları listeden sil** ile, şu anki filtreye göre **indirmeye hiç dahil olmayan** adresleri kalıcı listeden kaldırın (indirmede olmayanları “çıkarma”).
6. **Listeyi temizle** tüm toplanan adresleri siler.
7. Toplamayı durdurmak için **Toplamayı aç** kutusunun işaretini kaldırın.

### Notlar

- `chrome://`, Web Mağazası ve bazı kısıtlı sayfalarda içerik betiği çalışmaz; bu tarayıcı kuralıdır.
- TLD, alan adının **son noktadan sonraki parçası** olarak alınır (`ornek.co.uk` → `uk` gibi sınırlamalar olabilir).
- Yalnızca izniniz olan sitelerde ve yasalara uygun kullanın.

## Dosya yapısı

| Dosya | Görev |
|--------|--------|
| `manifest.json` | Uzantı tanımı |
| `background.js` | Gelen adresleri birleştirir, depolar |
| `content.js` | Sayfada e-posta arar |
| `popup.html` / `popup.js` | Arayüz, filtre, indirme |

## Güncelleme

Kodu değiştirdikten sonra `chrome://extensions` sayfasında bu uzantının **Yenile** (↻) düğmesine basın.
