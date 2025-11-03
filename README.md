**Backend Setup->** cd dev+backend

**Run the notebook first->**  "AI FA.ipynb"

**Then start the FastAPI server:** python app.py

**(if Uvicorn or pip isn’t recognized) Run this command in PowerShell to temporarily add Python Scripts to PATH:**
$env:Path += ";C:\Users\<your-username>\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\LocalCache\local-packages\Python312\Scripts"

**Then run using Uvicorn:**
uvicorn app:app --reload --host 127.0.0.1 --port 8000

**Your backend will now be live at:**
👉 http://127.0.0.1:8000

**Frontend Setup**:
cd frontendreact
npm install
npm start

**Frontend runs at:**
👉 http://localhost:3000



<img width="2557" height="1359" alt="image" src="https://github.com/user-attachments/assets/3f3ad35a-17cb-4882-b094-f4c0cd21db86" /> <img width="2559" height="1351" alt="image" src="https://github.com/user-attachments/assets/b82c233a-0381-4086-a791-d05f4f69537e" />

