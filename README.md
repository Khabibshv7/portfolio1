# Portfolio + Admin CMS

## Başlatma

```bash
npm install
npm start
```

- **Sayt:** http://localhost:8080
- **Admin:** http://localhost:8080/admin.html

Windows: `start.bat` iki dəfə klikləyin.

**Vacib:** `index.html` faylını birbaşa açmayın — məzmun gəlməz. Mütləq server ilə açın.

## Admin giriş

`.env` faylında `ADMIN_PASSWORD` təyin edin (nümunə: ``).

Daxil olduqdan sonra bütün məzmunu idarə edə bilərsiniz:

| Tab | CRUD |
|-----|------|
| Ümumi | Logo, CV, email, SEO, profil şəkli, Open to work |
| Menyu | Nav linkləri əlavə/sil/düzəlt |
| Hero | Ad, vəzifə, intro |
| Statistika | Rəqəmlər (3+ il və s.) |
| Təcrübə / Təhsil / Layihələr | Tam CRUD + modal mətn |
| Bacarıqlar | CRUD + neçəsi hero-da görünsün |
| Sertifikatlar | CRUD + featured |
| Əlavə bölmələr | Yeni tab/bölmə + kartlar |
| UI mətnlər | Düymə və başlıq tərcümələri |
| Sosial | Footer/hero linklər |

**Yadda saxla** düyməsi `data/content.json` faylını yeniləyir; sayt avtomatik yeni məzmunu göstərir.

## Fayl strukturu

```
data/content.json   — bütün məzmun
server.js           — API + statik server
js/render.js        — sayt render
js/app.js           — interaktiv UI
admin.html/js/css   — admin panel
```

## Qeyd

Yalnız `index.html` açsanız (server olmadan) məzmun `data/content.json`-dan oxunur, amma admin yadda saxlama işləməz. Həmişə `npm start` istifadə edin.
