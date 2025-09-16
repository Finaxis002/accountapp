"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Canvas, IText, Rect } from 'fabric';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Save, Undo, Redo, Type, Palette, Move, RotateCw } from "lucide-react";
import { toast } from "react-toastify";

interface PDFEditorProps {
  pdfBlob: Blob;
  onSave?: (modifiedPdf: Blob) => void;
  onExport?: (modifiedPdf: Blob) => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  width: number;
  height: number;
}

export function PDFEditor({ pdfBlob, onSave, onExport }: PDFEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedText, setSelectedText] = useState<TextElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  // Text editing state
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [textColor, setTextColor] = useState('#000000');
  const [textRotation, setTextRotation] = useState(0);

  // Available fonts
  const availableFonts = [
    'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
    'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
    'Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique'
  ];

  // Initialize PDF and Canvas
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    const initializeEditor = async () => {
      try {
        console.log('🚀 Starting PDF editor initialization...');
        if (!isMounted) return;

        setIsLoading(true);
        setError(null);

        if (!pdfBlob) {
          throw new Error('No PDF blob provided');
        }

        console.log('📄 PDF blob received, size:', pdfBlob.size, 'bytes');

        // Canvas element should now be immediately available since it's always rendered
        if (!canvasRef.current) {
          throw new Error('Canvas element not found - this should not happen');
        }

        console.log('✅ Canvas element found immediately!');

        // Set up timeout for initialization (30 seconds)
        const timeout = setTimeout(() => {
          if (isMounted) {
            console.error('⏰ PDF editor initialization timeout');
            setError('PDF editor initialization timed out. Please try again.');
            setIsLoading(false);
          }
        }, 30000);

        if (!isMounted) return;

        setLoadTimeout(timeout);

        // Step 1: Convert blob to ArrayBuffer
        console.log('🔄 Converting blob to ArrayBuffer...');
        const arrayBuffer = await pdfBlob.arrayBuffer();
        console.log('✅ ArrayBuffer created, size:', arrayBuffer.byteLength, 'bytes');

        if (!isMounted) return;

        // Step 2: Load PDF document
        console.log('📖 Loading PDF document with PDF-lib...');
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        console.log('✅ PDF document loaded successfully, pages:', pdfDoc.getPageCount());

        if (!isMounted) return;

        setPdfDoc(pdfDoc);
        setTotalPages(pdfDoc.getPageCount());

        // Step 3: Initialize Fabric.js canvas
        console.log('🎨 Initializing Fabric.js canvas...');

        console.log('🖼️ Creating Fabric canvas instance...');
        const canvas = new Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: '#f5f5f5',
          selection: true,
          preserveObjectStacking: true
        });

        if (!isMounted) return;

        fabricCanvasRef.current = canvas;
        console.log('✅ Fabric canvas created successfully');

        // Step 4: Load first page
        console.log('📄 Loading first page...');
        await loadPage(1, pdfDoc, canvas);

        if (!isMounted) return;

        // Step 5: Set up event listeners
        console.log('🎧 Setting up canvas event listeners...');
        setupCanvasEvents(canvas);

        // Clear timeout on success
        clearTimeout(timeout);
        setLoadTimeout(null);

        console.log('🎉 PDF editor initialization completed successfully!');
        setIsLoading(false);

      } catch (error) {
        if (!isMounted) return;

        console.error('❌ Error initializing PDF editor:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        // Try fallback: create a basic canvas for editing
        console.log('🔄 Attempting fallback canvas creation...');
        try {
          if (canvasRef.current && isMounted) {
            const fallbackCanvas = new Canvas(canvasRef.current, {
              width: 800,
              height: 600,
              backgroundColor: '#f8f9fa'
            });

            fabricCanvasRef.current = fallbackCanvas;

            // Add some sample text for editing
            const fallbackText = new IText(
              'PDF loading failed, but you can still edit this text!',
              {
                left: 50,
                top: 50,
                fontSize: 16,
                fontFamily: 'Helvetica',
                fill: '#dc3545',
                selectable: true,
                hasControls: true,
                hasBorders: true,
                width: 300
              }
            );

            const instructionText = new IText(
              'Use the properties panel to edit font, size, and color',
              {
                left: 50,
                top: 100,
                fontSize: 12,
                fontFamily: 'Helvetica',
                fill: '#6c757d',
                selectable: true,
                hasControls: true,
                hasBorders: true,
                width: 400
              }
            );

            fallbackCanvas.add(fallbackText);
            fallbackCanvas.add(instructionText);
            setupCanvasEvents(fallbackCanvas);

            console.log('✅ Fallback canvas created successfully');
            setError(`PDF loading failed: ${errorMessage}. Using fallback editor.`);
            setIsLoading(false);
            toast.warning('PDF loading failed. Using basic editor mode.');
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback canvas creation also failed:', fallbackError);
        }

        setError(`Failed to load PDF editor: ${errorMessage}`);
        setIsLoading(false);
        toast.error(`PDF Editor Error: ${errorMessage}`);

        // Clear timeout on error
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          setLoadTimeout(null);
        }
      }
    };

    if (pdfBlob) {
      console.log('🔍 PDF blob detected, starting initialization...');
      initializeEditor();
    } else {
      console.warn('⚠️ No PDF blob provided to PDF editor');
      setError('No PDF data available for editing');
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [pdfBlob]);

  const loadPage = async (pageNum: number, pdfDoc: PDFDocument, canvas: Canvas) => {
    try {
      console.log(`📄 Loading page ${pageNum}...`);
      const page = pdfDoc.getPage(pageNum - 1);
      const { width, height } = page.getSize();
      console.log(`📏 PDF page size: ${width}x${height}`);

      // Scale to fit canvas
      const scale = Math.min(800 / width, 600 / height);
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      console.log(`🔍 Scale factor: ${scale}, Scaled size: ${scaledWidth}x${scaledHeight}`);

      canvas.setWidth(scaledWidth);
      canvas.setHeight(scaledHeight);
      canvas.backgroundColor = '#ffffff';

      // Clear existing objects
      canvas.clear();
      console.log('🧹 Canvas cleared');

      // Add page background
      const pageRect = new Rect({
        left: 0,
        top: 0,
        width: scaledWidth,
        height: scaledHeight,
        fill: '#f0f8ff', // Light blue background to make it visible
        selectable: false,
        evented: false
      });
      canvas.add(pageRect);
      console.log('📄 Page background added');

      // Extract and render text elements
      await extractTextElements(page, canvas, scale);

      // Force render
      canvas.renderAll();
      console.log('🎨 Canvas render forced');

    } catch (error) {
      console.error('❌ Error loading page:', error);
    }
  };

  const extractTextElements = async (page: any, canvas: Canvas, scale: number) => {
    try {
      console.log('📝 Extracting text elements...');

      // Get canvas dimensions
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      console.log(`🎨 Canvas dimensions: ${canvasWidth}x${canvasHeight}`);

      // Create sample editable text elements positioned within visible canvas area
      const sampleTexts = [
        { text: 'Invoice Number', x: 50, y: 50, fontSize: 16 },
        { text: 'Company Name', x: 50, y: 100, fontSize: 18 },
        { text: 'Total Amount', x: 300, y: 400, fontSize: 20 }
      ];

      console.log('📝 Adding sample text elements...');
      sampleTexts.forEach((textData, index) => {
        const textElement = new IText(textData.text, {
          left: Math.min(textData.x, canvasWidth - 200), // Ensure within canvas bounds
          top: Math.min(textData.y, canvasHeight - 50),  // Ensure within canvas bounds
          fontSize: Math.max(textData.fontSize, 14),     // Minimum readable size
          fontFamily: 'Helvetica',
          fill: '#000000',
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockScalingFlip: true,
          id: `text_${index}`
        });

        canvas.add(textElement);
        console.log(`✅ Added text element: "${textData.text}" at (${textElement.left}, ${textElement.top})`);
      });

      // Add a prominent welcome message
      const welcomeText = new IText('🎉 PDF Editor Ready! Click to edit text', {
        left: Math.min(100, canvasWidth - 300),
        top: Math.min(200, canvasHeight - 100),
        fontSize: 18,
        fontFamily: 'Helvetica',
        fill: '#2563eb', // Blue color
        selectable: true,
        hasControls: true,
        hasBorders: true,
        id: 'welcome_text'
      });

      canvas.add(welcomeText);
      console.log(`✅ Added welcome text at (${welcomeText.left}, ${welcomeText.top})`);

      // Add a very visible test element in the center
      const testText = new IText('🧪 TEST ELEMENT - Click Me!', {
        left: canvasWidth / 2 - 100,
        top: canvasHeight / 2 - 20,
        fontSize: 24,
        fontFamily: 'Helvetica',
        fill: '#ff0000', // Bright red
        backgroundColor: '#ffff00', // Yellow background
        selectable: true,
        hasControls: true,
        hasBorders: true,
        id: 'test_element'
      });
      canvas.add(testText);
      console.log(`✅ Added test element at (${testText.left}, ${testText.top})`);

      // Add a border indicator to show canvas boundaries
      const borderRect = new Rect({
        left: 5,
        top: 5,
        width: canvasWidth - 10,
        height: canvasHeight - 10,
        fill: 'transparent',
        stroke: '#ff6b6b',
        strokeWidth: 3,
        selectable: false,
        evented: false
      });
      canvas.add(borderRect);
      // Note: sendToBack might not be available in this Fabric.js version
      // borderRect.moveTo(0); // Alternative to send to back

      console.log('🎉 PDF Editor initialized with sample text elements');
      console.log(`📊 Total objects on canvas: ${canvas.getObjects().length}`);

      // Final render to ensure everything is visible
      canvas.renderAll();
      console.log('🎨 Final canvas render completed');

    } catch (error) {
      console.error('❌ Error extracting text elements:', error);

      // Fallback: add at least one editable text element
      try {
        const fallbackText = new IText('PDF Editor Active - Click to Edit!', {
          left: 50,
          top: 50,
          fontSize: 20,
          fontFamily: 'Helvetica',
          fill: '#dc2626', // Red color to make it visible
          selectable: true,
          hasControls: true,
          hasBorders: true,
          id: 'fallback_text'
        });
        canvas.add(fallbackText);
        console.log('✅ Added fallback text element');
      } catch (fallbackError) {
        console.error('❌ Fallback text creation also failed:', fallbackError);
      }
    }
  };

  const setupCanvasEvents = (canvas: Canvas) => {
    canvas.on('selection:created', (e) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && selectedObject.type === 'i-text') {
        updateSelectedTextProperties(selectedObject);
      }
    });

    canvas.on('selection:updated', (e) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && selectedObject.type === 'i-text') {
        updateSelectedTextProperties(selectedObject);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedText(null);
    });

    canvas.on('object:modified', () => {
      saveToHistory();
    });
  };

  const updateSelectedTextProperties = (fabricObject: any) => {
    const textElement: TextElement = {
      id: fabricObject.id || 'unknown',
      text: fabricObject.text || '',
      x: fabricObject.left || 0,
      y: fabricObject.top || 0,
      fontSize: fabricObject.fontSize || 12,
      fontFamily: fabricObject.fontFamily || 'Helvetica',
      color: fabricObject.fill || '#000000',
      rotation: fabricObject.angle || 0,
      width: fabricObject.width || 0,
      height: fabricObject.height || 0
    };

    setSelectedText(textElement);
    setFontSize(textElement.fontSize);
    setFontFamily(textElement.fontFamily);
    setTextColor(textElement.color);
    setTextRotation(textElement.rotation);
  };

  const updateTextProperty = (property: string, value: any) => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      switch (property) {
        case 'fontSize':
          activeObject.set('fontSize', value);
          setFontSize(value);
          break;
        case 'fontFamily':
          activeObject.set('fontFamily', value);
          setFontFamily(value);
          break;
        case 'fill':
          activeObject.set('fill', value);
          setTextColor(value);
          break;
        case 'angle':
          activeObject.set('angle', value);
          setTextRotation(value);
          break;
      }
      fabricCanvasRef.current.renderAll();
      saveToHistory();
    }
  };

  const addNewText = () => {
    if (!fabricCanvasRef.current) return;

    const textElement = new IText('New Text', {
      left: 100,
      top: 100,
      fontSize: 16,
      fontFamily: 'Helvetica',
      fill: '#000000',
      selectable: true,
      hasControls: true,
      hasBorders: true,
      id: `text_${Date.now()}`
    });

    fabricCanvasRef.current.add(textElement);
    fabricCanvasRef.current.setActiveObject(textElement);
    saveToHistory();
  };

  const saveToHistory = () => {
    if (!fabricCanvasRef.current) return;

    const canvasState = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasState);

    if (newHistory.length > 50) { // Limit history to 50 states
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0 && fabricCanvasRef.current) {
      const previousState = history[historyIndex - 1];
      fabricCanvasRef.current.loadFromJSON(previousState, () => {
        fabricCanvasRef.current?.renderAll();
        setHistoryIndex(historyIndex - 1);
      });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1 && fabricCanvasRef.current) {
      const nextState = history[historyIndex + 1];
      fabricCanvasRef.current.loadFromJSON(nextState, () => {
        fabricCanvasRef.current?.renderAll();
        setHistoryIndex(historyIndex + 1);
      });
    }
  };

  const saveChanges = async () => {
    if (!pdfDoc || !fabricCanvasRef.current) return;

    try {
      // Get all text objects from canvas
      const textObjects = fabricCanvasRef.current.getObjects().filter(
        obj => obj.type === 'i-text'
      );

      // Apply changes to PDF
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];

      // Clear existing content and add modified text
      textObjects.forEach((obj: any) => {
        const font = pdfDoc.embedStandardFont(StandardFonts[obj.fontFamily as keyof typeof StandardFonts] || StandardFonts.Helvetica);
        const color = hexToRgb(obj.fill);

        page.drawText(obj.text, {
          x: obj.left / fabricCanvasRef.current!.getZoom(),
          y: page.getHeight() - obj.top / fabricCanvasRef.current!.getZoom(),
          size: obj.fontSize / fabricCanvasRef.current!.getZoom(),
          font,
          color: rgb(color.r / 255, color.g / 255, color.b / 255)
        });
      });

      // Save modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedBlob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });

      if (onSave) {
        onSave(modifiedBlob);
      }

      toast.success('PDF saved successfully!');
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast.error('Failed to save PDF changes');
    }
  };

  const exportPDF = async () => {
    if (!pdfDoc || !fabricCanvasRef.current) return;

    try {
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedBlob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });

      if (onExport) {
        onExport(modifiedBlob);
      } else {
        // Default export behavior
        const url = URL.createObjectURL(modifiedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'edited-invoice.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-background">
        <Button onClick={addNewText} size="sm" disabled={isLoading || !!error}>
          <Type className="w-4 h-4 mr-2" />
          Add Text
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button onClick={undo} disabled={historyIndex <= 0 || isLoading || !!error} size="sm" variant="outline">
          <Undo className="w-4 h-4" />
        </Button>

        <Button onClick={redo} disabled={historyIndex >= history.length - 1 || isLoading || !!error} size="sm" variant="outline">
          <Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button onClick={saveChanges} size="sm" disabled={isLoading || !!error}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button onClick={exportPDF} size="sm" variant="outline" disabled={isLoading || !!error}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex flex-1">
        {/* Properties Panel */}
        {selectedText && (
          <Card className="w-80 m-4">
            <CardHeader>
              <CardTitle className="text-sm">Text Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={fontSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFontSize(value);
                    updateTextProperty('fontSize', value);
                  }}
                  min="8"
                  max="72"
                />
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select value={fontFamily} onValueChange={(value) => {
                  setFontFamily(value);
                  updateTextProperty('fontFamily', value);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFonts.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      updateTextProperty('fill', e.target.value);
                    }}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      updateTextProperty('fill', e.target.value);
                    }}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rotation">Rotation (degrees)</Label>
                <Input
                  id="rotation"
                  type="number"
                  value={textRotation}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setTextRotation(value);
                    updateTextProperty('angle', value);
                  }}
                  min="-180"
                  max="180"
                />
              </div>

              <div>
                <Label>Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="posX" className="text-xs">X</Label>
                    <Input
                      id="posX"
                      type="number"
                      value={Math.round(selectedText.x)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (fabricCanvasRef.current) {
                          const activeObject = fabricCanvasRef.current.getActiveObject();
                          if (activeObject) {
                            activeObject.set('left', value);
                            fabricCanvasRef.current.renderAll();
                            saveToHistory();
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="posY" className="text-xs">Y</Label>
                    <Input
                      id="posY"
                      type="number"
                      value={Math.round(selectedText.y)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (fabricCanvasRef.current) {
                          const activeObject = fabricCanvasRef.current.getActiveObject();
                          if (activeObject) {
                            activeObject.set('top', value);
                            fabricCanvasRef.current.renderAll();
                            saveToHistory();
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Panel (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2 bg-yellow-50 border-b text-xs text-yellow-800">
            <div className="flex items-center gap-4 flex-wrap">
              <span>Debug:</span>
              <span>Loading: {isLoading ? 'Yes' : 'No'}</span>
              <span>Error: {error ? 'Yes' : 'No'}</span>
              <span>PDF Blob: {pdfBlob ? `${pdfBlob.size} bytes` : 'None'}</span>
              <span>Canvas: {fabricCanvasRef.current ? 'Ready' : 'Not Ready'}</span>
              {fabricCanvasRef.current && (
                <>
                  <span>Objects: {fabricCanvasRef.current.getObjects().length}</span>
                  <span>Size: {fabricCanvasRef.current.getWidth()}x{fabricCanvasRef.current.getHeight()}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs"
                    onClick={() => {
                      const objects = fabricCanvasRef.current?.getObjects() || [];
                      console.log('📋 Canvas Objects:', objects.map((obj, i) => ({
                        index: i,
                        type: obj.type,
                        text: obj.text || 'N/A',
                        left: obj.left,
                        top: obj.top,
                        visible: obj.visible
                      })));
                    }}
                  >
                    Log Objects
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div className="flex-1 p-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50 min-h-[400px] relative">
            {/* Always render the canvas element */}
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-200"
              style={{
                display: 'block',
                margin: '0 auto',
                minHeight: '400px',
                backgroundColor: '#f8f9fa'
              }}
              width="800"
              height="600"
            />

            {/* Overlay for loading state */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading PDF Editor...</p>
                </div>
              </div>
            )}

            {/* Overlay for error state */}
            {error && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 p-6">
                <div className="text-center max-w-md">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">PDF Editor Error</h3>
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setError(null);
                        setIsLoading(true);
                        // Re-run the initialization
                        if (pdfBlob) {
                          const initializeEditor = async () => {
                            try {
                              setIsLoading(true);
                              setError(null);
                              const arrayBuffer = await pdfBlob.arrayBuffer();
                              const pdfDoc = await PDFDocument.load(arrayBuffer);
                              setPdfDoc(pdfDoc);
                              setTotalPages(pdfDoc.getPageCount());

                              if (canvasRef.current) {
                                const canvas = new Canvas(canvasRef.current, {
                                  width: 800,
                                  height: 600,
                                  backgroundColor: '#f5f5f5'
                                });
                                fabricCanvasRef.current = canvas;
                                await loadPage(1, pdfDoc, canvas);
                                setupCanvasEvents(canvas);
                                setIsLoading(false);
                              }
                            } catch (err) {
                              console.error('Retry failed:', err);
                              setError('Retry failed. Please refresh the page.');
                              setIsLoading(false);
                            }
                          };
                          initializeEditor();
                        }
                      }}
                      size="sm"
                      className="mr-2"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      size="sm"
                      variant="outline"
                    >
                      Refresh Page
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>If the problem persists:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Check browser console for detailed errors</li>
                      <li>Ensure PDF file is not corrupted</li>
                      <li>Try with a different PDF file</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}