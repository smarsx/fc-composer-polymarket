import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Position } from '@/lib/position';


interface ConditionSelectionFormProps {
  positions: Position[];
  onSubmit: (position: Position) => void;
}

export default function ConditionSelectionForm({ positions, onSubmit }: ConditionSelectionFormProps) {
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConditionId) {
      const selectedPosition = positions.find(
        pos => pos.conditionId === selectedConditionId
      )
      if (selectedPosition) {
        onSubmit(selectedPosition);
      }
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Select a Position</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="submit" className="w-full" disabled={!selectedConditionId}>
              Submit
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
