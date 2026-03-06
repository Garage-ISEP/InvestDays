import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthentification } from "../context/AuthContext";
import { useRouter } from "next/router";
import homeStyles from "../styles/Home.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";
import { useLanguage } from "../context/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface User {
  id: number;
  email: string;
  name?: string | null;
  admin: boolean;
  token: string;
}

export default function AdminDashboard() {
  const { user } = useAuthentification() as { user: User | null };
  const { lang } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const translations = {
    fr: {
      title: "Tableau de Bord Admin",
      users: "Utilisateurs inscrits",
      transac: "Transactions totales",
      total: "Masse Monétaire (€)",
      avg: "Moyenne Portefeuille (€)",
      chartTx: "Transactions exécutées / jour",
      chartCash: "Masse monétaire cumulée / jour",
      chartReg: "Inscriptions cumulées / jour",
      loading: "Chargement des données...",
      error: "Erreur lors du chargement.",
      noData: "Pas encore de données"
    },
    en: {
      title: "Admin Dashboard",
      users: "Registered Users",
      transac: "Total Transactions",
      total: "Total Money Supply (€)",
      avg: "Average Wallet (€)",
      chartTx: "Executed transactions / day",
      chartCash: "Cumulative money supply / day",
      chartReg: "Cumulative registrations / day",
      loading: "Loading data...",
      error: "Error while loading.",
      noData: "No data yet"
    }
  };

  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    if (user !== undefined) {
      if (!user || !user.admin) {
        router.push("/");
      } else {
        fetchStats();
      }
    }
  }, [user, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const result = await res.json();
      if (res.ok && result.data) setStats(result.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.admin) return null;

  return (
    <>
      <Head>
        <title>InvestDays - {t.title}</title>
      </Head>

      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.welcomeSection}>
          <h1 className={homeStyles.marketTitle}>{t.title}</h1>
        </div>

        {loading ? (
          <p className={homeStyles.emptyMessage}>{t.loading}</p>
        ) : !stats ? (
          <p className={homeStyles.emptyMessage} style={{ color: "red" }}>{t.error}</p>
        ) : (
          <>
            <div className={homeStyles.assetsGrid} style={{ marginTop: "20px" }}>
              <StatCard title={t.users} value={stats.users} color="#ffcc00" />
              <StatCard title={t.transac} value={stats.transactions} color="#4CAF50" />
              <StatCard title={t.total} value={`${Number(stats.totalCash).toFixed(2)} €`} color="#2196F3" />
              <StatCard title={t.avg} value={`${Number(stats.averageCash).toFixed(2)} €`} color="#9c27b0" />
            </div>

            <ChartBox title={t.chartReg} empty={stats.registrationsPerDay.length === 0} noData={t.noData}>
              <LineChart data={stats.registrationsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#ffcc00" strokeWidth={2} dot={{ r: 4 }} name="Total inscrits" />
                <Line type="monotone" dataKey="count" stroke="#ff9800" strokeWidth={2} dot={{ r: 4 }} name="Nouveaux / jour" strokeDasharray="5 5" />
              </LineChart>
            </ChartBox>

            <ChartBox title={t.chartTx} empty={stats.transactionsPerDay.length === 0} noData={t.noData}>
              <LineChart data={stats.transactionsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} name="Transactions" />
              </LineChart>
            </ChartBox>

            <ChartBox title={t.chartCash} empty={stats.cashPerDay.length === 0} noData={t.noData} last>
              <LineChart data={stats.cashPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `${v} €`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2196F3" strokeWidth={2} dot={{ r: 4 }} name="Cash total" />
              </LineChart>
            </ChartBox>
          </>
        )}
      </main>
    </>
  );
}

function ChartBox({ title, empty, noData, children, last }: { 
  title: string; empty: boolean; noData: string; children: React.ReactNode; last?: boolean 
}) {
  return (
    <div style={{ 
      background: "white", borderRadius: "15px", padding: "25px", 
      marginTop: "20px", marginBottom: last ? "40px" : "0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)" 
    }}>
      <h2 style={{ fontSize: "16px", color: "#555", marginBottom: "20px" }}>{title}</h2>
      {empty ? (
        <p style={{ color: "#aaa", textAlign: "center" }}>{noData}</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {children as any}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: any; color: string }) {
  return (
    <div className={homeStyles.assetCard} style={{ borderTop: `4px solid ${color}`, textAlign: "center" }}>
      <h3 style={{ fontSize: "13px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>{title}</h3>
      <p style={{ fontSize: "26px", fontWeight: "bold", margin: "12px 0", color: "#333" }}>{value}</p>
    </div>
  );
}

AdminDashboard.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};