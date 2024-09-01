import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Position } from '@/lib/position';
import { DEPLOYMENT_URL } from '@/lib/constants';

function generateEmbedUrl(
  title: string,
  pct: string,
  src: string,
  isYes: boolean
): string {
  return `${DEPLOYMENT_URL}/api/generate?src=${src}?title=${title}?pct=${pct}?isYes=${
    isYes ? "1" : "0"
  }`;
}

interface ConditionSelectionFormProps {
  positions: Position[];
  onSubmit: (position: Position) => void;
}

export default function ConditionSelectionForm({ positions, onSubmit }: ConditionSelectionFormProps) {
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    console.log('handle submit')
    e.preventDefault();
    console.log('Handle submit triggered');
    if (selectedConditionId) {
      const selectedPosition = positions.find(
        pos => pos.conditionId === selectedConditionId
      );
      if (selectedPosition) {
        console.log('Calling onSubmit with selected position');
        onSubmit(selectedPosition);
      }
    }
  };

  return (
    <Card className="w-[350px]">
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-3">
            <Label>Positions</Label>
            <RadioGroup
              onValueChange={setSelectedConditionId}
              value={selectedConditionId || undefined}
            >
              {positions.map((position) => (
                <div className="flex items-center space-x-3 space-y-0" key={position.conditionId}>
                  <RadioGroupItem value={position.conditionId} id={position.conditionId} />
                  <Label htmlFor={position.conditionId} className="font-normal">
                    {position.title || 'Untitled Condition'}
                    <span className="block text-sm text-muted-foreground">
                      Profit: {position.profits}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <CardFooter className="px-0">
            <Button type="submit" className="w-full" disabled={!selectedConditionId} onSubmit={() => {
              const pos = positions.find(
                pos => pos.conditionId === selectedConditionId
              );
              if (pos) {
                window.parent.postMessage({
                  type: "createCast",
                  data: {
                    cast: {
                      text: "xx",
                      embeds: [generateEmbedUrl(pos.title ?? '', '100', pos.src ?? '', true)]
                    }
                  }
                })
              }
            }}>
              Submit
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}