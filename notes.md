git clone repo
cd clinic-management-system

docker compose up-d

cd backend
npm install
npm run migrate
npm run seed
npm run dev

cd frontend
npm install
npm run dev
