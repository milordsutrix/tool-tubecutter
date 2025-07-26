import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Plus, Trash2, Music } from "lucide-react";
import { Selection } from "@/pages/home";

interface SelectionsManagerProps {
  selections: Selection[];
  addSelection: () => void;
  updateSelection: (id: string, updates: Partial<Selection>) => void;
  removeSelection: (id: string) => void;
}

export default function SelectionsManager({
  selections,
  addSelection,
  updateSelection,
  removeSelection,
}: SelectionsManagerProps) {
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return "0:00";
    
    const parseTime = (time: string): number => {
      const parts = time.split(':').map(n => parseInt(n));
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return 0;
    };

    const startSeconds = parseTime(startTime);
    const endSeconds = parseTime(endTime);
    const durationSeconds = Math.max(0, endSeconds - startSeconds);
    
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateFilename = (title: string): string => {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.mp3';
  };

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Scissors className="text-primary mr-2" />
            Audio Selections
          </h2>
          <Button onClick={addSelection} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Selection</span>
          </Button>
        </div>

        <div className="space-y-4">
          {selections.map((selection, index) => (
            <div key={selection.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  Selection {index + 1}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSelection(selection.id)}
                  className="text-gray-400 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </Label>
                  <Input
                    placeholder="00:30"
                    pattern="^([0-5]?[0-9]):([0-5][0-9])$|^([0-1]?[0-9]):([0-5]?[0-9]):([0-5][0-9])$"
                    value={selection.startTime}
                    onChange={(e) => updateSelection(selection.id, { startTime: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: MM:SS or HH:MM:SS</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </Label>
                  <Input
                    placeholder="01:45"
                    pattern="^([0-5]?[0-9]):([0-5][0-9])$|^([0-1]?[0-9]):([0-5]?[0-9]):([0-5][0-9])$"
                    value={selection.endTime}
                    onChange={(e) => updateSelection(selection.id, { endTime: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">
                    File Title
                  </Label>
                  <Input
                    placeholder="Intro Guitar Solo"
                    value={selection.title}
                    onChange={(e) => updateSelection(selection.id, { title: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be the MP3 filename</p>
                </div>
              </div>
              
              {/* Selection Preview */}
              <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Duration: <span className="font-medium">{calculateDuration(selection.startTime, selection.endTime)}</span>
                  </span>
                  <span className="text-gray-600">
                    Output: <span className="font-mono text-primary">{selection.title ? generateFilename(selection.title) : 'untitled.mp3'}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {selections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Music className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No selections added yet</p>
              <p className="text-sm">Click "Add Selection" to define audio segments to extract</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
