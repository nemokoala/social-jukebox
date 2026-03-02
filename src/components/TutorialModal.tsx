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

export function TutorialModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="w-4 h-4 mr-2" />
          이용 방법 안내
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md gap-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            주크박스
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            같은 공간에 있는 사람들과 함께
            <br />
            음악을 즐길 수 있는 서비스입니다! 🎵
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg">
          <div className="flex gap-4 items-start bg-muted/80 p-4 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2 h-fit shrink-0">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                👑 호스트 (방장)
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                '방 만들기'를 통해 새로운 방을 개설하고,{" "}
                <strong>현재 기기를 스피커로 사용</strong>하여 음악을
                재생합니다.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-muted/80 p-4 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2 h-fit shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                👥 참여자 (게스트)
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                호스트가 알려준{" "}
                <span className="font-bold text-primary">4자리 코드</span>를
                입력해 방에 접속합니다. 그 후 각자의 스마트폰에서 듣고 싶은
                노래를 자유롭게 검색해 추가할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-muted/80 p-4 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2 h-fit shrink-0">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                🎧 다 함께 감상하기
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                추가된 노래들은 플레이리스트에 등록되어 순서대로 재생됩니다. 다
                함께 원하는 음악을 감상해 보세요!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
