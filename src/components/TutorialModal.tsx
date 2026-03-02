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
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="w-4 h-4 mr-2" />
          {t("btn_text")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md gap-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription
            className="text-center text-base"
            dangerouslySetInnerHTML={{ __html: t.raw("description") }}
          />
        </DialogHeader>

        <div className="space-y-2 rounded-lg">
          <div className="flex gap-4 items-start bg-muted/80 p-4 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2 h-fit shrink-0">
              <Play className="h-5 w-5 text-primary" />
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

          <div className="flex gap-4 items-start bg-muted/80 p-4 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2 h-fit shrink-0">
              <Users className="h-5 w-5 text-primary" />
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

          <div className="flex gap-4 items-start bg-muted/80 p-4 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2 h-fit shrink-0">
              <Headphones className="h-5 w-5 text-primary" />
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
