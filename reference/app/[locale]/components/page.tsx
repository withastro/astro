'use client';

import { AlertTriangle, Check, Info, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"

export default function ComponentsShowcase() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">UI Components Showcase</h1>
        <p className="text-gray-600">Eine Übersicht aller verfügbaren UI-Komponenten mit Beispielimplementierungen</p>
      </div>

      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Formulare</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="dialogs">Dialoge</TabsTrigger>
        </TabsList>

        {/* Buttons Section */}
        <TabsContent value="buttons" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Buttons & Toggles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="default">Standard Button</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link Button</Button>
            <Button disabled>Disabled</Button>
            <Button>
              <Info className="mr-2 h-4 w-4" />
              Mit Icon
            </Button>
          </div>
          <div className="flex gap-4 mt-8">
            <Toggle>Standard Toggle</Toggle>
            <Toggle variant="outline">Outline Toggle</Toggle>
          </div>
        </TabsContent>

        {/* Cards Section */}
        <TabsContent value="cards" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil Übersicht</CardTitle>
                <CardDescription>Ihre Konto-Details und Einstellungen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-gray-500">john@example.com</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Konto verwalten</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projekt Status</CardTitle>
                <CardDescription>Aktuelle Projekt-Metriken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tasks abgeschlossen</span>
                    <Badge>12/15</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Fortschritt</span>
                    <span className="text-green-600">80%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Details anzeigen</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Forms Section */}
        <TabsContent value="forms" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Formular-Elemente</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Eingabefelder</CardTitle>
                <CardDescription>Verschiedene Eingabetypen und Zustände</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input type="email" id="email" placeholder="E-Mail eingeben" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input type="password" id="password" placeholder="Passwort eingeben" />
                </div>
                <div className="space-y-2">
                  <Label>Option auswählen</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Option auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" />
                  <Label htmlFor="notifications">Benachrichtigungen aktivieren</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback Section */}
        <TabsContent value="feedback" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Feedback-Komponenten</h2>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Dies ist eine informative Nachricht für den Benutzer.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>
                Etwas ist schiefgelaufen! Bitte versuchen Sie es erneut.
              </AlertDescription>
            </Alert>

            <Alert className="border-green-500 text-green-500">
              <Check className="h-4 w-4" />
              <AlertTitle>Erfolg</AlertTitle>
              <AlertDescription>
                Ihre Änderungen wurden erfolgreich gespeichert.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-3 gap-4">
              <Badge>Standard Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="destructive">Destructive Badge</Badge>
            </div>
          </div>
        </TabsContent>

        {/* Dialogs Section */}
        <TabsContent value="dialogs" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Dialoge & Sheets</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dialog</CardTitle>
                <CardDescription>Modal Dialog Beispiel</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Dialog öffnen</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sind Sie sicher?</DialogTitle>
                      <DialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Abbrechen</Button>
                      <Button>Bestätigen</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sheet</CardTitle>
                <CardDescription>Slide-in Panel Beispiel</CardDescription>
              </CardHeader>
              <CardContent>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button>Sheet öffnen</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Einstellungen</SheetTitle>
                      <SheetDescription>
                        Passen Sie Ihre Anwendungseinstellungen an.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notifications-sheet">Benachrichtigungen</Label>
                          <Switch id="notifications-sheet" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="theme-sheet">Dark Mode</Label>
                          <Switch id="theme-sheet" />
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 