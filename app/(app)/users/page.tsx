"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getUsers, addUser, deleteUser } from "@/lib/store";
import type { User, Role } from "@/types/user";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("student");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    setUsers(getUsers());
  }, [currentUser]);

  if (currentUser?.role !== "admin") {
    return <div className="text-center py-20 text-slate-500">Access Denied. Admins only.</div>;
  }

  const handleAddUser = () => {
    if (!newName || !newPin || newPin.length !== 4) return;
    const u: User = {
      id: `u_${Date.now()}`,
      name: newName,
      role: newRole,
      pin: newPin
    };
    addUser(u);
    setUsers(getUsers());
    setNewName(""); setNewPin(""); setShowForm(false);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("You cannot delete yourself!");
      return;
    }
    if (confirm("Delete this user?")) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">User Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition"
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder="Full Name"
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50" 
            />
            <select 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <input 
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} 
              placeholder="4-digit PIN"
              maxLength={4}
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white text-center tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/50" 
            />
          </div>
          <button 
            onClick={handleAddUser}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-bold text-white hover:shadow-lg transition"
          >
            Create User Account
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50">
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
              <th className="text-center px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">PIN</th>
              <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/20 transition">
                <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                    ${u.role === "admin" ? "bg-red-500/20 text-red-400" : 
                      u.role === "teacher" ? "bg-purple-500/20 text-purple-400" : 
                      "bg-blue-500/20 text-blue-400"}
                  `}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-mono text-slate-500">****</td>
                <td className="px-6 py-4 text-right">
                  {u.id !== currentUser.id && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 hover:text-red-400 text-xs font-bold"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
