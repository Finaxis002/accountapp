// import { redirect } from 'next/navigation';

// export default function RootPage() {
//   redirect('/login');
//   return null;
// }




export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Vinimay</h1> 
      </div>
    </main>
  );
}
