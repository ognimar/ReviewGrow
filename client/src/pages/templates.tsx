import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image as ImageIcon, Type, Save, Eye, Plus, Trash2, Loader2, Layout } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTemplates, createTemplate, deleteTemplate } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  imageUrl: string;
  textX: number;
  textY: number;
  fontSize: number;
  fontColor: string;
  createdAt: string;
}

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewText, setPreviewText] = useState("John");
  const [templateName, setTemplateName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [fontSize, setFontSize] = useState([40]);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [textX, setTextX] = useState([50]);
  const [textY, setTextY] = useState([50]);

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      toast({ title: 'Template created successfully' });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create template', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast({ title: 'Template deleted' });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete template', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const resetForm = () => {
    setTemplateName("");
    setSelectedImage(null);
    setImagePreview("");
    setFontSize([40]);
    setFontColor("#ffffff");
    setTextX([50]);
    setTextY([50]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: 'Please enter a template name', variant: 'destructive' });
      return;
    }
    
    const formData = new FormData();
    formData.append('name', templateName);
    formData.append('textX', textX[0].toString());
    formData.append('textY', textY[0].toString());
    formData.append('fontSize', fontSize[0].toString());
    formData.append('fontColor', fontColor);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    
    createMutation.mutate(formData);
  };

  const colorOptions = [
    { color: '#ffffff', label: 'White' },
    { color: '#000000', label: 'Black' },
    { color: '#ef4444', label: 'Red' },
    { color: '#3b82f6', label: 'Blue' },
    { color: '#22c55e', label: 'Green' },
    { color: '#f59e0b', label: 'Yellow' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">Image Templates</h1>
            <p className="text-muted-foreground">Create and personalize image templates with dynamic text.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-template">
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Upload an image and configure text overlay settings.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                {/* Editor Controls */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input 
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="My Template"
                      data-testid="input-template-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Base Image</Label>
                    <div 
                      className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {selectedImage ? selectedImage.name : 'Click to upload base image'}
                      </span>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageSelect}
                      data-testid="input-image-file"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preview Text</Label>
                    <Input 
                      value={previewText} 
                      onChange={(e) => setPreviewText(e.target.value)} 
                      placeholder="Sample name"
                      data-testid="input-preview-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Font Size</Label>
                      <span className="text-sm text-muted-foreground">{fontSize[0]}px</span>
                    </div>
                    <Slider 
                      value={fontSize} 
                      onValueChange={setFontSize} 
                      min={12} 
                      max={120} 
                      step={1}
                      data-testid="slider-font-size"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Text Position X</Label>
                      <span className="text-sm text-muted-foreground">{textX[0]}%</span>
                    </div>
                    <Slider 
                      value={textX} 
                      onValueChange={setTextX} 
                      min={0} 
                      max={100} 
                      step={1}
                      data-testid="slider-text-x"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Text Position Y</Label>
                      <span className="text-sm text-muted-foreground">{textY[0]}%</span>
                    </div>
                    <Slider 
                      value={textY} 
                      onValueChange={setTextY} 
                      min={0} 
                      max={100} 
                      step={1}
                      data-testid="slider-text-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      {colorOptions.map(({ color, label }) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                            fontColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFontColor(color)}
                          title={label}
                          data-testid={`button-color-${label.toLowerCase()}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleSaveTemplate}
                    disabled={createMutation.isPending}
                    data-testid="button-save-template"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Template
                  </Button>
                </div>

                {/* Preview Area */}
                <div className="bg-slate-100 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                  {imagePreview ? (
                    <div className="relative max-w-full overflow-hidden rounded shadow-lg">
                      <img 
                        src={imagePreview}
                        alt="Template Preview" 
                        className="max-h-[400px] w-auto object-contain"
                      />
                      <div 
                        className="absolute font-bold drop-shadow-lg"
                        style={{ 
                          fontSize: `${fontSize[0]}px`,
                          color: fontColor,
                          left: `${textX[0]}%`,
                          top: `${textY[0]}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {previewText}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Upload an image to preview</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create your first image template to personalize for campaigns.</p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-template">
              <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} data-testid={`card-template-${template.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>
                    Font: {template.fontSize}px | Color: {template.fontColor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {template.imageUrl ? (
                    <div className="relative aspect-video bg-slate-100 rounded overflow-hidden">
                      <img 
                        src={template.imageUrl} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute font-bold drop-shadow-lg"
                        style={{ 
                          fontSize: `${Math.min(template.fontSize, 24)}px`,
                          color: template.fontColor,
                          left: `${template.textX}%`,
                          top: `${template.textY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {"{{name}}"}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 rounded flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1" data-testid={`button-edit-template-${template.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Preview
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMutation.mutate(template.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-template-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
