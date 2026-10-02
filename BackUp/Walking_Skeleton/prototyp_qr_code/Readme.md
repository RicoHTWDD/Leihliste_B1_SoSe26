Nun ist der Prototyp für QR Code Generierung fertig, es hat ziemlich viele Dateien 
im Vergleich zur Funkiton die sie erfüllt. 
Das ist so weil ein Prototyp eine komplette Grundstruktur für eine Webanwendung
 gibt auch wenn die zu entwicklende Funktion nicht so schwierig oder komplex ist. 
Um das Programm ausführen zu können, müsst ihr zwei Terminals öffnen, eine für frontend
 also der Pfad soll bis zur Directory frontend gehen ungefähr so: ...\Leihliste_B1_SoSe26\docs\technical\prototyp_qr_code\frontend>   
 und ein anderes Terminal für Backend. 
In Backend Terminal führt ihr folgenden Befehl aus: python -m pip install -r requirements.txt        
In Frontend dann diesen Befehl (ein anderes Terminal): npm install
 Ebenso ist node.js aus dem Internet herunterzuladen und auf dem Computer zu installieren. dann in backend diesen befehl ausführen: python manage.py runserver           
 und im Frontend: npm run dev
In Frontend findet ihr dann eine Ausgabe die ungefähr so aussihet:   
➜  Local:   http://localhost:5173/             
bei euch könnte der Port also die Nummer 5173 eine andere sein. diesen Link also http://localhost:5173/
 oder wie es bei euch steht kopiert ihr in einen Browser und suche starten. 
 Es öffnet sich eine Seite wo die QR Code Generierung Funktion zu sehen ist