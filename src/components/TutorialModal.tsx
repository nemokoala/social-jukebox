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
      <DialogContent className="gap-6 border-white/70 bg-white/90 shadow-2xl shadow-fuchsia-500/20 backdrop-blur-xl sm:max-w-md dark:border-white/10 dark:bg-slate-950/90">
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
          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-r from-rose-50 to-fuchsia-50 p-4 dark:from-rose-500/10 dark:to-fuchsia-500/10">
            <div className="h-fit shrink-0 rounded-full bg-rose-500/15 p-2">
              <Play className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                {t("host_title")}
              </h4>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t.raw("host_desc") }}
              />
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 p-4 dark:from-sky-500/10 dark:to-cyan-500/10">
            <div className="h-fit shrink-0 rounded-full bg-sky-500/15 p-2">
              <Users className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                {t("guest_title")}
              </h4>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t.raw("guest_desc") }}
              />
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-400/10 dark:to-orange-500/10">
            <div className="h-fit shrink-0 rounded-full bg-amber-400/20 p-2">
              <Headphones className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                {t("listen_title")}
              </h4>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t.raw("listen_desc") }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
