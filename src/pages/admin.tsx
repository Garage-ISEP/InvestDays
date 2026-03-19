import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthentification } from "../context/AuthContext";
import { useRouter } from "next/router";
import homeStyles from "../styles/Home.module.css";
import DashBoardLayout from "../components/layouts/DashBoard.layout";
import { useLanguage } from "../context/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
  BarChart, Bar 
} from "recharts";

interface User {
  id: number;
  email: string;
  name?: string | null;
  admin: boolean;
  token: string;
}

const COLORS = ["#4CAF50", "#FF5252"]; // Vert = Actifs, Rouge = Inactifs

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
      chartRatio: "Ratio d'activité (7j)",
      chartGrowth: "Croissance globale (Transactions cumulées)",
      chartDailyActive: "Participants uniques par jour",
      active: "Actifs (≥ 5 tx)",
      inactive: "Inactifs",
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
      chartRatio: "Activity Ratio (7d)",
      chartGrowth: "Global Growth (Cumulative Transactions)",
      chartDailyActive: "Daily Unique Participants",
      active: "Active (≥ 5 tx)",
      inactive: "Inactive",
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
        <title>Invest Days - {t.title}</title>
        <link rel="icon" href="/favicon3.ico" />
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
            {/* 1. CARTES DE STATISTIQUES */}
            <div className={homeStyles.assetsGrid} style={{ marginTop: "20px" }}>
              <StatCard title={t.users} value={stats.users} color="#ffcc00" />
              <StatCard title={t.transac} value={stats.transactions} color="#4CAF50" />
              <StatCard title={t.total} value={`${Number(stats.totalCash).toFixed(2)} €`} color="#2196F3" />
              <StatCard title={t.avg} value={`${Number(stats.averageCash).toFixed(2)} €`} color="#9c27b0" />
            </div>

            {/* 2. GRAPHIQUE DE CROISSANCE GLOBALE (AREA) */}
            <ChartBox title={t.chartGrowth} empty={!stats.cumulativeTransactions} noData={t.noData}>
              <AreaChart data={stats.cumulativeTransactions}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffdb58" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ffdb58" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#ffdb58" 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  name="Transactions totales"
                />
              </AreaChart>
            </ChartBox>

            {/* 3. RATIO ET INSCRIPTIONS (GRILLE 2 COLONNES) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                <ChartBox title={t.chartRatio} empty={!stats.activeRatio} noData={t.noData}>
                  <PieChart>
                    <Pie
                      data={stats.activeRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.activeRatio.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ChartBox>

                <ChartBox title={t.chartReg} empty={stats.registrationsPerDay.length === 0} noData={t.noData}>
                  <LineChart data={stats.registrationsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    {/* On change 'total' par 'count' ici : */}
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ffcc00" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      name="Nouveaux inscrits" 
                    />
                  </LineChart>
                </ChartBox>
            </div>

            {/* 4. TRANSACTIONS JOUR ET CASH */}
            <ChartBox title={t.chartTx} empty={stats.transactionsPerDay.length === 0} noData={t.noData}>
              <LineChart data={stats.transactionsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} name="Tx/Jour" />
              </LineChart>
            </ChartBox>

            <ChartBox title={t.chartDailyActive} empty={!stats.activeUsersPerDay} noData={t.noData}>
              <BarChart data={stats.activeUsersPerDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{fill: '#f5f5f5'}} />
                <Bar 
                  dataKey="count" 
                  fill="#ffdb58" 
                  radius={[4, 4, 0, 0]} 
                  name="Participants actifs" 
                />
              </BarChart>
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
        background: "white", borderRadius: "15px", padding: "20px", 
        marginTop: "20px", marginBottom: last ? "40px" : "0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)" 
      }}>
        <h2 style={{ fontSize: "14px", color: "#555", marginBottom: "15px", fontWeight: "600" }}>{title}</h2>
        {empty ? (
          <p style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>{noData}</p>
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
      <div className={homeStyles.assetCard} style={{ borderTop: `4px solid ${color}`, textAlign: "center", padding: "15px" }}>
        <h3 style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: "bold" }}>{title}</h3>
        <p style={{ fontSize: "22px", fontWeight: "bold", margin: "8px 0", color: "#333" }}>{value}</p>
      </div>
    );
  }

AdminDashboard.getLayout = function getLayout(page: any) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};