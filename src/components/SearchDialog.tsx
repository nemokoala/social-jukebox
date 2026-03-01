"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Link } from "lucide-react";
import { SearchTab } from "@/components/SearchTab";
import { LinkTab } from "@/components/LinkTab";

interface SearchDialogProps {
  roomId: string;
  trigger?: React.ReactNode;
}

export function SearchDialog({ roomId, trigger }: SearchDialogProps) {
  const [open, setOpen] = useState(false);

  /**
   * 다이얼로그가 닫힐 때 key를 교체해 탭 컴포넌트를 리마운트 → state 초기화
   */
  const [tabKey, setTabKey] = useState(0);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTabKey((k) => k + 1);
    }
  };

  const handleSuccess = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="w-full py-4 px-4 bg-primary text-primary-foreground font-semibold rounded-md shadow flex items-center justify-center space-x-2">
            <span>+ YouTube에서 곡 추가</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>곡 추가</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1 gap-1.5">
              <Search className="w-3.5 h-3.5" />
              검색
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 gap-1.5">
              <Link className="w-3.5 h-3.5" />
              링크로 추가
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="search"
            className="flex flex-col flex-1 min-h-0 mt-3"
          >
            <SearchTab
              key={`search-${tabKey}`}
              roomId={roomId}
              onSuccess={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="link" className="mt-3">
            <LinkTab
              key={`link-${tabKey}`}
              roomId={roomId}
              onSuccess={handleSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
