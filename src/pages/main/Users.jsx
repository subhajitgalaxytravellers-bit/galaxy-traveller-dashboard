import DataTable from '@/components/DataTable';
import { Header } from '@/components/Header';
import UserPanel from '@/components/users/UserPanel';
import React from 'react';

const Users = () => {
  // function RolePill({ role }) {
  //   const map = {
  //     admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  //     creator:
  //       "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  //     client:
  //       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  //   };
  //   const cls =
  //     map[role] ||
  //     "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-200";
  //   return (
  //     <span
  //       className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
  //     >
  //       {role}
  //     </span>
  //   );
  // }

  // const columns = [
  //   { key: "id", label: "ID", thClass: " w-32", hideable: false },
  //   {
  //     key: "name",
  //     label: "Name",
  //     thClass: "min-w-[220px]",
  //     hideable: false,
  //     cell: (r) => (
  //       <div className="flex items-center gap-3">
  //         <img
  //           src={r.profileImg}
  //           alt={r.name}
  //           className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-900"
  //         />
  //         <div className="leading-tight">
  //           <div className="font-medium">{r.name}</div>
  //           <div className="text-xs text-gray-500 dark:text-gray-400">
  //             {r.email}
  //           </div>
  //         </div>
  //       </div>
  //     ),
  //   },
  //   {
  //     key: "role",
  //     label: "Role",
  //     thClass: "w-32",
  //     cell: (r) => <RolePill role={r.role} />,
  //   },
  //   { key: "location", label: "Location", thClass: "w-40" },
  //   {
  //     key: "social",
  //     label: "Socials",
  //     thClass: "w-28",
  //     accessor: (r) => `${r.social?.length ?? 0} links`,
  //   },
  //   {
  //     key: "createdAt",
  //     label: "Joined",
  //     thClass: "w-36",
  //     accessor: (r) => new Date(r.createdAt).toLocaleDateString(),
  //   },
  // ];

  // const Users = [
  //   {
  //     id: "U-1099",
  //     name: "Rishabh Sharma",
  //     email: "rishabh@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rishabh",
  //     bio: "Travel creator & storyteller.",
  //     location: "Raipur, CG",
  //     social: ["https://instagram.com/rishabh", "https://youtube.com/@rishabh"],
  //     role: "creator",
  //     createdAt: "2025-07-21T10:15:00.000Z",
  //   },
  //   {
  //     id: "U-1001",
  //     name: "Rishabh Sharma",
  //     email: "rishabh@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rishabh",
  //     bio: "Travel creator & storyteller.",
  //     location: "Raipur, CG",
  //     social: ["https://instagram.com/rishabh", "https://youtube.com/@rishabh"],
  //     role: "creator",
  //     createdAt: "2025-07-21T10:15:00.000Z",
  //   },
  //   {
  //     id: "U-1002",
  //     name: "Aarav Mehta",
  //     email: "aarav@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
  //     bio: "Full-stack dev",
  //     location: "Bengaluru, KA",
  //     social: ["https://github.com/aarav"],
  //     role: "admin",
  //     createdAt: "2025-06-12T09:00:00.000Z",
  //   },
  //   {
  //     id: "U-1003",
  //     name: "Priya Singh",
  //     email: "priya@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
  //     bio: "Brand strategist",
  //     location: "Mumbai, MH",
  //     social: ["https://linkedin.com/in/priya", "https://twitter.com/priya"],
  //     role: "client",
  //     createdAt: "2025-05-02T14:30:00.000Z",
  //   },
  //   {
  //     id: "U-1004",
  //     name: "Dev Patel",
  //     email: "dev@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev",
  //     bio: "MERN + RN",
  //     location: "Ahmedabad, GJ",
  //     social: [],
  //     role: "creator",
  //     createdAt: "2025-04-18T08:10:00.000Z",
  //   },
  //   {
  //     id: "U-1005",
  //     name: "Neha Verma",
  //     email: "neha@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neha",
  //     bio: "Ops @ Galaxy Travellers",
  //     location: "Delhi, DL",
  //     social: ["https://instagram.com/neha"],
  //     role: "client",
  //     createdAt: "2025-03-01T11:25:00.000Z",
  //   },
  //   {
  //     id: "U-1006",
  //     name: "Karan Gupta",
  //     email: "karan@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan",
  //     bio: "UI Engineer",
  //     location: "Pune, MH",
  //     social: ["https://dribbble.com/karan", "https://behance.net/karan"],
  //     role: "creator",
  //     createdAt: "2025-02-09T17:45:00.000Z",
  //   },
  //   {
  //     id: "U-1007",
  //     name: "Isha Jain",
  //     email: "isha@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isha",
  //     bio: "SEO & content",
  //     location: "Jaipur, RJ",
  //     social: ["https://linkedin.com/in/isha"],
  //     role: "client",
  //     createdAt: "2025-01-15T07:20:00.000Z",
  //   },
  //   {
  //     id: "U-1008",
  //     name: "Rahul Kumar",
  //     email: "rahul@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
  //     bio: "DevOps",
  //     location: "Hyderabad, TS",
  //     social: [],
  //     role: "admin",
  //     createdAt: "2024-12-05T19:05:00.000Z",
  //   },
  //   {
  //     id: "U-1009",
  //     name: "Ananya Roy",
  //     email: "ananya@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
  //     bio: "Photographer",
  //     location: "Kolkata, WB",
  //     social: ["https://instagram.com/ananya"],
  //     role: "creator",
  //     createdAt: "2024-11-22T12:40:00.000Z",
  //   },
  //   {
  //     id: "U-1010",
  //     name: "Vikram Singh",
  //     email: "vikram@example.com",
  //     profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
  //     bio: "Biz dev",
  //     location: "Chennai, TN",
  //     social: ["https://linkedin.com/in/vikram"],
  //     role: "client",
  //     createdAt: "2024-10-10T10:10:00.000Z",
  //   },
  // ];

  return (
    <div className=' w-full min-h-screen flex flex-col '>
      <Header title='Users' />
      <div className='p-4 '>
        <UserPanel />
      </div>
    </div>
  );
};

export default Users;
