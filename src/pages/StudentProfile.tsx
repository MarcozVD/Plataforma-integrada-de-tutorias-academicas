import { User, BookOpen, Clock, Accessibility, Eye, Ear, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const StudentProfile = () => (
  <main className="container mx-auto px-4 py-6 max-w-3xl">
    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
      <User className="h-6 w-6" /> Mi Perfil
    </h1>
    <p className="text-muted-foreground mb-6">Configura tu perfil y preferencias</p>

    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Información académica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre completo</Label>
              <Input defaultValue="Juan Pérez Rodríguez" className="mt-1" />
            </div>
            <div>
              <Label>Carrera</Label>
              <Input defaultValue="Ingeniería de Sistemas" className="mt-1" />
            </div>
            <div>
              <Label>Semestre</Label>
              <Input defaultValue="4to semestre" className="mt-1" />
            </div>
            <div>
              <Label>Código estudiantil</Label>
              <Input defaultValue="2023-0145" className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" /> Materias de interés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Cálculo I", "Programación II", "Álgebra Lineal", "Física II", "Estadística"].map((s) => (
              <Badge key={s} variant="secondary" className="text-sm py-1 px-3">{s}</Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3">+ Agregar materia</Button>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Accessibility className="h-5 w-5" /> Necesidades de accesibilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="pvisual" />
            <Label htmlFor="pvisual" className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> Apoyo visual</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="paudit" />
            <Label htmlFor="paudit" className="flex items-center gap-1.5"><Ear className="h-4 w-4" /> Apoyo auditivo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="pphysical" />
            <Label htmlFor="pphysical" className="flex items-center gap-1.5"><Accessibility className="h-4 w-4" /> Acceso físico (silla de ruedas)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Preferencias de tutoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Horario preferido</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {["Mañana (7-12)", "Tarde (12-18)", "Noche (18-21)"].map((h) => (
                <Badge key={h} variant="outline" className="cursor-pointer hover:bg-accent py-1.5 px-3">{h}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full">Guardar cambios</Button>
    </div>
  </main>
);

export default StudentProfile;
