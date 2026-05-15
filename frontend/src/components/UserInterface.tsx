import React, { useState, useEffect } from "react";
import axios from "axios";
import CardComponent from "./CardComponent";

interface User {
    id: number;
    name: string;
    email: string;
}

interface UserInterfaceProps {
    backendName: string;
}

const UserInterface: React.FC<UserInterfaceProps> = ({ backendName }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const usersEndpoint = `${apiUrl}/api/rust/users`;
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ name: "", email: "" });
    const [updateUser, setUpdateUser] = useState({ id: "", name: "", email: "" });
    
    // Define styles based on the backend name
    const backgroundColors: { [key: string]: string } = {
        "Rust": "from-orange-500 via-amber-500 to-orange-600",
    };

    const textColors: { [key: string]: string } = {
        "Rust": "bg-orange-600 hover:bg-orange-500",
    };

    const backgroundColor = backgroundColors[backendName as keyof typeof backgroundColors] || "from-slate-700 via-slate-800 to-slate-950";
    const btnColor = textColors[backendName as keyof typeof textColors] || "bg-slate-700 hover:bg-slate-600";

    // fetch users from the backend
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(usersEndpoint);
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, [usersEndpoint]);

    // create user function
    const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const response = await axios.post(usersEndpoint, newUser);
            setUsers((currentUsers) => [response.data, ...currentUsers]);
            setNewUser({ name: "", email: "" }); 
        } catch (error) {
            console.error("Error creating user:", error);
        }
    };

    // update user function
    const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const userId = parseInt(updateUser.id);
        const currentUser = users.find((user) => user.id === userId);

        if (!currentUser || Number.isNaN(userId)) {
            console.error("Error updating user: invalid or missing user id");
            return;
        }

        const updatedName = updateUser.name.trim() === "" ? currentUser.name : updateUser.name;
        const updatedEmail = updateUser.email.trim() === "" ? currentUser.email : updateUser.email;

        try {
            await axios.put(`${usersEndpoint}/${userId}`, {
                name: updatedName,
                email: updatedEmail,
            });
            setUpdateUser({ id: "", name: "", email: "" });
            setUsers((currentUsers) =>
                currentUsers.map((user) => {
                    if (user.id === userId) {
                        return { ...user, name: updatedName, email: updatedEmail };
                    }
                    return user;
                })
            );
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };  

    // delete user function
    const deleteUser = async (id: number) => {
        try {
            await axios.delete(`${usersEndpoint}/${id}`);
            setUsers((currentUsers) => currentUsers.filter((user) => user.id !== id));
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    // other functions
    return (
        <div className={`user-interface w-full max-w-5xl overflow-hidden rounded-4xl border border-white/60 bg-linear-to-br ${backgroundColor} p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)]`}>
            <div className="rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur-xl md:p-8">
                <div className="mb-8 flex flex-col gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200">
                            <img src="/rustlogo.png" alt="Rust logo" className="h-10 w-10" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">User management</p>
                            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Rust User Service</h2>
                            <p className="mt-1 max-w-xl text-sm text-slate-600">
                                Create, update, and manage users from a single clean dashboard.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center md:min-w-56">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Backend</div>
                            <div className="mt-1 text-lg font-bold text-slate-900">{backendName}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-orange-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Users</div>
                            <div className="mt-1 text-lg font-bold text-orange-700">{users.length}</div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <form onSubmit={createUser} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <div className="mb-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">Create user</p>
                            <h3 className="mt-1 text-xl font-semibold text-slate-900">Add a new record</h3>
                        </div>
                        <div className="space-y-3">
                            <input
                                placeholder="Name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value})}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                            <input
                                placeholder="Email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value})}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                            <button type="submit" className="w-full rounded-2xl bg-orange-600 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-600/25 transition hover:bg-orange-500">
                                Add User
                            </button>
                        </div>
                    </form>

                    <form onSubmit={handleUpdateUser} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <div className="mb-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Update user</p>
                            <h3 className="mt-1 text-xl font-semibold text-slate-900">Edit an existing record</h3>
                        </div>
                        <div className="space-y-3">
                            <input
                                placeholder="User ID"
                                value={updateUser.id}
                                onChange={(e) => setUpdateUser({ ...updateUser, id: e.target.value})}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                            <input
                                placeholder="New Name"
                                value={updateUser.name}
                                onChange={(e) => setUpdateUser({ ...updateUser, name: e.target.value})}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                            <input
                                placeholder="New Email"
                                value={updateUser.email}
                                onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value})}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
                                Update User
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Directory</p>
                            <h3 className="text-xl font-semibold text-slate-900">Current users</h3>
                        </div>
                        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                            {users.length === 0 ? "No records yet" : `${users.length} record(s)`}
                        </div>
                    </div>

                    {users.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
                            No users found. Add the first user using the form above.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {users.map((user) => (
                                <div key={user.id} className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <CardComponent card={user} />
                                    <button onClick={() => deleteUser(user.id)} className="rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-500">
                                        Delete User
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) 
}

export default UserInterface;