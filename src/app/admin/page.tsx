"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

interface Family {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: "admin" | "member";
  createdAt: string;
}

export default function AdminDashboard(): ReactElement {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamilies, setSelectedFamilies] = useState<Record<string, string>>({});
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [familiesRes, usersRes] = await Promise.all([
        fetch("/api/admin/families"),
        fetch("/api/admin/users"),
      ]);

      if (familiesRes.ok) {
        const data = await familiesRes.json();
        setFamilies(data.families);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function moveUser(userId: string) {
    const targetFamilyId = selectedFamilies[userId];
    if (!targetFamilyId) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetFamilyId }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error moving user:", error);
    }
  }

  async function createFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!newFamilyName.trim() || creatingFamily) return;
    setCreatingFamily(true);
    try {
      const res = await fetch("/api/admin/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFamilyName.trim() }),
      });
      if (res.ok) {
        setNewFamilyName("");
        await fetchData();
      }
    } catch (error) {
      console.error("Error creating family:", error);
    } finally {
      setCreatingFamily(false);
    }
  }

  async function generateInvite(familyId: string) {
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteLinks((prev) => ({ ...prev, [familyId]: data.inviteUrl }));
      }
    } catch (error) {
      console.error("Error generating invite:", error);
    }
  }

  function copyInviteLink(familyId: string) {
    const link = inviteLinks[familyId];
    if (link) {
      navigator.clipboard.writeText(link);
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <div className="text-lg">Laden...</div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <div></div>;
  }

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Beheerder</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Families</h2>

        <form onSubmit={createFamily} className="flex gap-2 mb-4">
          <label htmlFor="new-family-name" className="sr-only">Nieuwe familienaam</label>
          <input
            id="new-family-name"
            type="text"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            placeholder="Nieuwe familie"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            type="submit"
            disabled={creatingFamily || !newFamilyName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Aanmaken
          </button>
        </form>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Naam
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leden
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uitnodigen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {families.map((family) => (
                <tr key={family.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{family.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {family.memberCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {inviteLinks[family.id] ? (
                      <button
                        onClick={() => copyInviteLink(family.id)}
                        aria-label={`Kopieer uitnodigingslink voor ${family.name}`}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                      >
                        Kopieer link
                      </button>
                    ) : (
                      <button
                        onClick={() => generateInvite(family.id)}
                        aria-label={`Genereer uitnodiging voor ${family.name}`}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                      >
                        Uitnodigen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Gebruikers</h2>
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="bg-white shadow rounded-lg p-4">
              <div className="mb-2">
                <div className="font-semibold">{u.name}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
                <div className="text-sm text-gray-500">
                  {families.find((f) => f.id === u.familyId)?.name || u.familyId} • {u.role}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <label htmlFor={`family-select-${u.id}`} className="sr-only">Familie voor {u.name}</label>
                <select
                  id={`family-select-${u.id}`}
                  value={selectedFamilies[u.id] || u.familyId}
                  onChange={(e) =>
                    setSelectedFamilies({ ...selectedFamilies, [u.id]: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => moveUser(u.id)}
                  aria-label={`Verplaats ${u.name}`}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Verplaatsen
                </button>
                <button
                  onClick={() => deleteUser(u.id)}
                  aria-label={`Verwijder ${u.name}`}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
