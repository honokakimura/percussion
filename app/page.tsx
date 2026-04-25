"use client";
import { useEffect, useState } from "react";
import { Drum } from "lucide-react";
import { useStore } from "@/store/useStore";
import { GenerateView } from "@/components/views/GenerateView";
import { SongsManageView } from "@/components/views/SongsManageView";
import { InstrumentsManageView } from "@/components/views/InstrumentsManageView";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "generate" | "songs" | "instruments";

const TABS: { id: Tab; label: string }[] = [
  { id: "generate", label: "申請作成" },
  { id: "songs", label: "曲の管理" },
  { id: "instruments", label: "楽器の管理" },
];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("generate");
  const { fetchAll, loaded } = useStore();
  const { toasts, showToast } = useToast();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="min-h-dvh bg-zinc-50">
      <div className="max-w-[560px] mx-auto px-4 py-4">
        <Card className="mb-3">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
              <Drum size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-zinc-900 leading-tight">打楽器 運搬申請</h1>
              <p className="text-xs text-zinc-500">シンプルに作成してそのままコピー</p>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {!loaded ? (
            <Card>
              <CardContent className="min-h-[260px] flex items-center justify-center text-zinc-500 text-sm pt-4">
                読み込み中...
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="generate">
                <GenerateView showToast={showToast} />
              </TabsContent>
              <TabsContent value="songs">
                <SongsManageView showToast={showToast} />
              </TabsContent>
              <TabsContent value="instruments">
                <InstrumentsManageView showToast={showToast} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}