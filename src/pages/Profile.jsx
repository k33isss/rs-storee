import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { useOrders } from "../lib/db";
import { useUser, updateUser, signOut } from "../lib/wallet";
import { fmtDate } from "../lib/orders";
import Page, { fieldCls, btnPrimary, card, Label, Notice } from "../components/Page";
import { api } from "../lib/api";

export default function Profile() {
    const user = useUser();
    const [remoteUser, setRemoteUser] = useState(null);
    useEffect(() => { api("/auth/me").then(setRemoteUser).catch(() => {}); }, []);
    const profile = remoteUser || user;
    const navigate = useNavigate();
    const orders = useOrders().filter((o) => o.walletId === user.walletId);
    const [name, setName] = useState(user.name);
    const [err, setErr] = useState("");
    const [saved, setSaved] = useState(false);
    const [phone, setPhone] = useState(user.phone || ""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [verifyMsg, setVerifyMsg] = useState("");
    const done = orders.filter((o) => o.status === "done");
    const spent = done.reduce((s, o) => s + o.price, 0);

    const save = (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setErr("أدخل اسمك (حرفان على الأقل).");
        updateUser(user.id, (u) => ({ ...u, name: name.trim() }));
        setErr(""); setSaved(true);
    };
    const logout = () => { signOut(); navigate("/login"); };

    return (
        <Page title="ملفي الشخصي">
            <div className="mt-5 flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-full border-2 border-gold-500 bg-gold-500/15 text-2xl font-extrabold text-gold-300">{profile.name.trim().charAt(0).toUpperCase()}</div>
                <div className="min-w-0"><p className="truncate font-bold" dir="auto">{profile.name}</p><p className="truncate text-sm text-mute" dir="ltr">{profile.email || user.id}</p></div>
            </div>

            <section className={`${card} mt-5 grid grid-cols-2 gap-3 p-4`}>
                <div className="flex items-center gap-2"><CheckCircle2 className={`size-5 ${profile.emailVerified ? "text-emerald-400" : "text-gold-400"}`} /><div><p className="text-xs text-mute">البريد الإلكتروني</p><p className="text-sm font-semibold">{profile.emailVerified ? "موثّق" : "بانتظار التفعيل"}</p></div></div>
                <div className="flex items-center gap-2"><CheckCircle2 className={`size-5 ${profile.phoneVerified ? "text-emerald-400" : "text-gold-400"}`} /><div><p className="text-xs text-mute">رقم الهاتف</p><p className="text-sm font-semibold">{profile.phoneVerified ? "موثّق" : "غير موثّق"}</p></div></div>
                <div className="flex items-center gap-2"><ShieldCheck className={`size-5 ${profile.verified ? "text-emerald-400" : "text-gold-400"}`} /><div><p className="text-xs text-mute">الهوية الشخصية</p><p className="text-sm font-semibold">{profile.verified ? "موثّقة" : "غير موثّقة"}</p></div></div>
                <div className="flex items-center gap-2"><CircleAlert className="size-5 text-gold-400" /><div><p className="text-xs text-mute">الحماية</p><p className="text-sm font-semibold">{user.pin ? "PIN مفعّل" : "فعّل PIN"}</p></div></div>
            </section>
            <Link to="/verification" className="mt-3 block rounded-xl border border-gold-500/40 py-3 text-center text-sm font-bold text-gold-300">{profile.verified ? "عرض حالة التوثيق" : "توثيق الحساب الآن"}</Link>

            <section className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[["الطلبات", orders.length], ["المكتملة", done.length], ["الإنفاق", "$" + Math.round(spent * 100) / 100]].map(([l, v]) => (
                    <div key={l} className={`${card} p-3`}><p className="text-xs text-mute">{l}</p><p className="mt-1 font-extrabold text-gold-300" dir="ltr">{v}</p></div>
                ))}
            </section>

            <form onSubmit={save} noValidate className={`${card} mt-5 space-y-4 p-4`}>
                <Label id="nm" label="الاسم" error={err}><input id="nm" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={60} dir="auto" className={fieldCls(err)} /></Label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-mute">رقم المحفظة</p><p className="mt-1 font-mono font-bold text-gold-300" dir="ltr">{user.walletId}</p></div>
                    <div><p className="text-mute">تاريخ الانضمام</p><p className="mt-1" dir="ltr">{user.created ? fmtDate(user.created) : "—"}</p></div>
                </div>
                <button className={btnPrimary}>حفظ التعديلات</button>
                {saved && <Notice>تم حفظ التعديلات.</Notice>}
            </form>

            <section className={`${card} mt-5 space-y-4 p-4`}>
                <div><h2 className="font-bold">تفعيل رقم الهاتف</h2><p className="mt-1 text-xs text-mute">استخدم رقم سوري بصيغة 09xxxxxxxx أو +9639xxxxxxxx</p></div>
                <div className="flex gap-2"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" dir="ltr" className={fieldCls(false)} /><button type="button" onClick={async () => { try { await api("/phone/send", { method: "POST", body: JSON.stringify({ phone }) }); setSent(true); setVerifyMsg("تم إرسال الكود"); } catch (e) { setVerifyMsg(e.message); } }} className="shrink-0 rounded-xl bg-gold-500 px-3 text-sm font-bold text-ink-950">إرسال الكود</button></div>
                {sent && <div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="كود التفعيل" dir="ltr" className={fieldCls(false)} /><button type="button" onClick={async () => { try { await api("/phone/verify", { method: "POST", body: JSON.stringify({ code }) }); setVerifyMsg("تم تفعيل رقم الهاتف بنجاح"); } catch (e) { setVerifyMsg(e.message); } }} className="shrink-0 rounded-xl border border-gold-500 px-3 text-sm font-bold text-gold-300">تأكيد</button></div>}
                {verifyMsg && <Notice>{verifyMsg}</Notice>}
            </section>

            <button type="button" onClick={logout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 py-3 text-sm font-semibold text-red-400"><LogOut className="size-4" /> تسجيل خروج</button>
        </Page>
    );
}
