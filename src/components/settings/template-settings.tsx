// @/components/settings/template-settings.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const templateOptions = [
  { value: "template1", label: "Professional" },
  { value: "template2", label: "Creative" },
  { value: "template3", label: "Modern" },
  { value: "template4", label: "Minimal" },
  { value: "template5", label: "Refined" },
  { value: "template6", label: "Standard" },
  // { value: "template7", label: "Prestige" },
];

export function TemplateSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  // Load current template setting
  React.useEffect(() => {
    const loadTemplateSetting = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/settings/default-template");
        if (response.ok) {
          const data = await response.json();
          setSelectedTemplate(data.defaultTemplate || "template1");
        }
      } catch (error) {
        console.error("Failed to load template setting:", error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateSetting();
  }, [toast]);

const handleSave = async () => {
  setIsSaving(true);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${baseURL}/api/settings/default-template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Add the token here
      },
      body: JSON.stringify({ defaultTemplate: selectedTemplate }), // No clientId here
    });

    if (response.ok) {
      toast({
        title: "Success",
        description: "Default template updated successfully",
      });
    } else {
      throw new Error("Failed to save template");
    }
  } catch (error) {
    console.error("Failed to save template:", error);
    toast({
      title: "Error",
      description: "Failed to save template setting",
      variant: "destructive",
    });
  } finally {
    setIsSaving(false);
  }
};


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Template</CardTitle>
        <CardDescription>
          Choose your preferred invoice template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template">Default Invoice Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger id="template" className="w-full">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
