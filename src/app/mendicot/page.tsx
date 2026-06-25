import dynamic from "next/dynamic";

const MendicotRulesContent = dynamic(
  () => import("@/components/marketing/MendicotRulesContent"),
  {
    loading: () => (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function MendicotPage() {
  return <MendicotRulesContent />;
}
