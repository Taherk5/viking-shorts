# YouTube-upload (youtube-uploader-mcp) – opsætning og fjernelse

Kilde: github.com/anwerj/youtube-uploader-mcp, commit `f120cadd911e31651db1d44bc1d11ec19db86a8c` (v0.1.3, MIT), gennemgået og bygget fra kildekode.
SHA-256 af binæren: `af010ad0af9f97a83a77b1c7804de10aba9735c19ad0c8afe41899a2e8d68060`   ·   Genbyg selv: `./build.sh`   ·   Kommandolinje: `python3 -I yt.py --help`

## A. Opret nøglen hos Google (cirka 5 minutter, gør du selv)
1. console.cloud.google.com -> projektvælgeren øverst -> **New Project** -> navn fx `viking-uploader`.
2. **APIs & Services -> Library** -> søg "YouTube Data API v3" -> **Enable**.
3. **OAuth consent screen / Google Auth Platform** -> Get started. App-navn og din mail. Audience: **External**. Tilføj mailen til din YouTube-konto under **Test users**.
4. **Credentials -> Create credentials -> OAuth client ID**.
   - Application type: **Web application** (ikke Desktop; værktøjets redirect er https://localhost:8080 og skal være ens begge steder).
   - Authorized redirect URI: `https://localhost:8080`
   - Create -> **Download JSON**.
5. Læg hele filens indhold i miljøets indstillinger som variabel **YT_CLIENT_SECRET_JSON** (skyen-menuen i sessionens titellinje -> Edit). Aldrig i chatten. Start en ny session.

## B. Første login (jeg gør det, du klikker)
1. Jeg skriver nøglen til en privat fil og kører `yt.py auth-url`. Du får et Google-link.
2. Åbn det, vælg din kanal og tillad. Står der "Google hasn't verified this app": **Advanced -> Go to ... (unsafe)**. Det er din egen app.
3. Siden til sidst indlæses ikke (https://localhost:8080/?code=...). Kopiér hele adressen og send den til mig. Det er en engangskode, der er ubrugelig uden din klienthemmelighed.
4. `yt.py auth-code ...` gemmer adgangen. Test derefter med en **privat** upload og tjek i YouTube Studio.

## Kendte begrænsninger (læs før du stoler på det)
- Uploads fra et Google-projekt uden gennemgået revision kan være låst til **privat**. Prøv med en privat test først. Hvis den ikke kan gøres offentlig, er svaret Googles revisionsformular, eller vi skifter til Zapier.
- Nøglen i testtilstand udløber efter 7 dage. Sæt appen til "In production" (uden verifikation, med advarsel) for at undgå det.
- Scopet `youtube.force-ssl` giver adgang til at ændre og slette videoer på kanalen.
- Adgangsnøglen ligger i `.youtube_uploader_channels_cache` i arbejdsmappen (rettigheder 600). Containeren slettes, så nøglen skal gemmes sikkert, hvis daglig kørsel skal fungere. Vi aftaler hvordan, når testen virker.

## Fjernelse (hvis du vil af med det igen)
1. Slet mappen `tools/youtube-uploader-mcp` og `~/.yt-mcp`.
2. Fjern miljøvariablen YT_CLIENT_SECRET_JSON.
3. Træk adgangen tilbage: myaccount.google.com/permissions -> vælg appen -> **Remove access**.
4. Slet Google Cloud-projektet: console.cloud.google.com -> IAM & Admin -> Settings -> **Shut down**.
