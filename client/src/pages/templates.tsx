import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Type, Save, Eye } from "lucide-react";
import { useState } from "react";

export default function Templates() {
  const [text, setText] = useState("John");
  const [fontSize, setFontSize] = useState([40]);

  return (
    <DashboardLayout>
      <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-display font-bold tracking-tight">Image Templates</h1>
                <p className="text-muted-foreground">Create and personalize image templates with dynamic text.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Eye className="mr-2 h-4 w-4"/> Preview</Button>
                <Button><Save className="mr-2 h-4 w-4"/> Save Template</Button>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor Controls */}
            <Card className="lg:col-span-1 h-full">
                <CardHeader>
                    <CardTitle>Editor</CardTitle>
                    <CardDescription>Configure personalization layers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Base Image</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload base image</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Dynamic Text {"{{name}}"}</Label>
                        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Sample text" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label>Font Size</Label>
                            <span className="text-sm text-muted-foreground">{fontSize}px</span>
                        </div>
                        <Slider 
                            value={fontSize} 
                            onValueChange={setFontSize} 
                            min={12} 
                            max={120} 
                            step={1} 
                        />
                    </div>

                    <div className="space-y-4">
                         <Label>Color & Style</Label>
                         <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-black border cursor-pointer ring-2 ring-primary ring-offset-2"></div>
                            <div className="w-8 h-8 rounded-full bg-white border cursor-pointer"></div>
                            <div className="w-8 h-8 rounded-full bg-red-500 border cursor-pointer"></div>
                            <div className="w-8 h-8 rounded-full bg-blue-500 border cursor-pointer"></div>
                         </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Area */}
            <Card className="lg:col-span-2 h-full bg-slate-100/50 flex items-center justify-center relative overflow-hidden">
                <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white max-w-[80%]">
                    <img 
                        src="https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop" 
                        alt="Template Base" 
                        className="max-h-[600px] w-full object-cover opacity-90"
                    />
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-white drop-shadow-lg"
                        style={{ fontSize: `${fontSize[0]}px` }}
                    >
                        {text}
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
