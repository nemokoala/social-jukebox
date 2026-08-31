import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Music, Info, Users, Headphones, Play } from "lucide-react";
import { useTranslations } from "next-intl";

export function TutorialModal() {
  const t = useTranslations("TutorialModal");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full bg-white/55 px-4 font-semibold text-fuchsia-700 shadow-sm shadow-fuchsia-500/10 backdrop-blur transition-colors hover:bg-white/85 hover:text-rose-600 dark:bg-white/10 dark:text-fuchsia-100 dark:hover:bg-white/15"
        >
          <Info className="w-4 h-4 mr-2" />
          {t("btn_text")}
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-6 border-white bg-white shadow-2xl shadow-fuchsia-500/25 sm:max-w-md dark:border-white/10 dark:bg-slate-950">
        <DialogHeader className="gap-2">
          <DialogTitle className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-fuchsia-600 to-sky-500 bg-clip-text text-2xl font-black text-transparent">
            <Music className="h-6 w-6 text-fuchsia-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription
            className="text-center text-base text-slate-600 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: t.raw("description") }}
          />
        </DialogHeader>

        <div className="space-y-2 rounded-lg">
          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-r from-rose-100 to-fuchsia-100 p-4 dark:from-rose-500/15 dark:to-fuchsia-500/15">
            <div className="h-fit shrink-0 rounded-full bg-rose-500/20 p-2">
              <Play className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1 dark:text-slate-50">
                {t("host_title")}
              </h4>
              <p
                className="text-sm text-slate-700 leading-relaxed dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: t.raw("host_desc") }}
              />
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-r from-sky-100 to-cyan-100 p-4 dark:from-sky-500/15 dark:to-cyan-500/15">
            <div className="h-fit shrink-0 rounded-full bg-sky-500/20 p-2">
              <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1 dark:text-slate-50">
                {t("guest_title")}
              </h4>
              <p
                className="text-sm text-slate-700 leading-relaxed dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: t.raw("guest_desc") }}
              />
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 p-4 dark:from-amber-400/15 dark:to-orange-500/15">
            <div className="h-fit shrink-0 rounded-full bg-amber-400/30 p-2">
              <Headphones className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1 dark:text-slate-50">
                {t("listen_title")}
              </h4>
              <p
                className="text-sm text-slate-700 leading-relaxed dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: t.raw("listen_desc") }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
