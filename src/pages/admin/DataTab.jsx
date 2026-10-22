import { useRef, useState } from "react";
import { Download, Upload, FileSpreadsheet, DatabaseBackup } from "lucide-react";
import { useOrders, useDeposits, useFeedback, exportAll, restoreAll, resetAll, storageBytes, logAction } from "../../lib/db";
import { downloadFile, toCsv } from "../../lib/admin";
import { orderRef } from "../../lib/orders";
import { useAccounts } from "../../lib/db";
import { btnGhost, btnGold } from "./ui";

const box = "rounded-2xl border border-ink-700 bg-ink-900 p-5";
const iso = (t) => new Date(t).toISOString().replace("T", " ").slice(0, 16);

export default function DataTab() {
    const orders = useOrders(), deposits = useDeposits(), feedback = useFeedback(), accounts = useAccounts();
    const fileRef = useRef(null);
    const [msg, setMsg] = useState(null);
    const used = storageBytes();
    const pct = Math.min(100, Math.round((used / (5 * 1024 * 1024)) * 100));
    const who = (w) => Object.values(accounts).find((a) => a.walletId === w)?.name ?? w;

    const exp = {
        orders: () => downloadFile("orders.csv", toCsv(["رقم الطلب", "التاريخ", "الزبون", "المنتج", "الباقة", "السعر", "الخصم", "الكود", "الحالة", "البيانات"], orders.map((o) => [orderRef(o), iso(o.date), who(o.walletId), o.productName, o.pkgLabel, o.price, o.discount ?? 0, o.coupon ?? "", o.status, Object.entries(o.fields ?? {}).map(([k, v]) => `${k}: ${v}`).join(" | ")])), "text/csv"),
        deposits: () => downloadFile("deposits.csv", toCsv(["التاريخ", "الزبون", "العملة", "المبلغ", "رقم العملية", "الحالة", "السبب"], deposits.map((d) => [iso(new Date(d.date).getTime()), who(d.walletId), d.currency, d.amount, d.ref, d.status, d.reason ?? ""])), "text/csv"),
        feedback: () => downloadFile("feedback.csv", toCsv(["التاريخ", "الاسم", "النوع", "الرسالة", "الرد"], feedback.map((f) => [iso(f.t), f.name, f.kind, f.text, f.reply])), "text/csv"),
    };

    const backup = () => { downloadFile(`rs-games-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "rs-games", v: 1, t: Date.now(), data: exportAll() }), "application/json"); logAction("تنزيل نسخة احتياطية"); };
    const restore = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            const j = JSON.parse(await file.text());
            if (j.app !== "rs-games") throw new Error();
            if (!window.confirm("سيتم استبدال كل بيانات الموقع الحالية بمحتوى النسخة. متأكد؟")) return;
            const n = restoreAll(j.data);
            if (n < 0) throw new Error();
            logAction("استعادة نسخة احتياطية");
            setMsg({ t: `تمت الاستعادة (${n} قسم).` });
        } catch { setMsg({ bad: true, t: "الملف غير صالح أو ليس نسخة من هذا الموقع." }); }
    };

    return (
        <div className="space-y-5">
            <section className={box}>
                <h2 className="font-bold">مساحة التخزين</h2>
                <p className="mt-1 text-sm text-mute">البيانات محفوظة في متصفحك (حدّه نحو 5MB). الصور تستهلك أكثر شيء.</p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-800"><div className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : "bg-gold-500"}`} style={{ width: `${Math.max(2, pct)}%` }} /></div>
                <p className="mt-1.5 text-xs text-mute" dir="ltr">{(used / 1024).toFixed(0)} KB · {pct}%</p>
                {pct > 80 && <p className="mt-2 text-sm text-red-400">المساحة شبه ممتلئة. نزّل نسخة احتياطية وقلّل صور المنتجات.</p>}
            </section>

            <section className={box}>
                <h2 className="flex items-center gap-2 font-bold"><FileSpreadsheet className="size-5 text-gold-400" /> تقارير CSV</h2>
                <p className="mt-1 text-sm text-mute">تُفتح في Excel أو Google Sheets.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={exp.orders} className={`${btnGhost} flex items-center gap-2`}><Download className="size-4" /> الطلبات ({orders.length})</button>
                    <button type="button" onClick={exp.deposits} className={`${btnGhost} flex items-center gap-2`}><Download className="size-4" /> الإيداعات ({deposits.length})</button>
                    <button type="button" onClick={exp.feedback} className={`${btnGhost} flex items-center gap-2`}><Download className="size-4" /> الشكاوى ({feedback.length})</button>
                </div>
            </section>

            <section className={box}>
                <h2 className="flex items-center gap-2 font-bold"><DatabaseBackup className="size-5 text-gold-400" /> النسخ الاحتياطي</h2>
                <p className="mt-1 text-sm text-mute">يشمل الحسابات والأرصدة والطلبات والمنتجات والإعدادات والمحادثات. لا يشمل كلمة مرور الإدارة.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={backup} className={`${btnGold} flex items-center gap-2`}><Download className="size-4" /> تنزيل نسخة</button>
                    <input ref={fileRef} type="file" accept="application/json,.json" onChange={restore} className="hidden" />
                    <button type="button" onClick={() => fileRef.current.click()} className={`${btnGhost} flex items-center gap-2`}><Upload className="size-4" /> استعادة من ملف</button>
                </div>
                {msg && <p className={`mt-3 text-sm ${msg.bad ? "text-red-400" : "text-emerald-400"}`}>{msg.t}</p>}
            </section>

            <section className="rounded-2xl border border-red-500/40 bg-ink-900 p-5">
                <h2 className="font-bold text-red-400">حذف كل البيانات</h2>
                <p className="mt-1 text-sm text-mute">يحذف الحسابات والأرصدة والطلبات والإيداعات والمحادثات والمنتجات والإعدادات ويعيد الموقع كما كان في البداية. لا رجعة فيه إلا بنسخة احتياطية.</p>
                <button type="button" onClick={() => window.prompt("اكتب «حذف» للتأكيد") === "حذف" && resetAll()} className="mt-3 rounded-xl border border-red-500 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500 hover:text-white">حذف وإعادة الضبط</button>
            </section>
        </div>
    );
}
