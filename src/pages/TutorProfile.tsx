import { GraduationCap, BookOpen, Clock, Accessibility, Eye, Ear, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TutorProfile = () => (
  <main className="container mx-auto px-4 py-6 max-w-3xl">
    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
      <GraduationCap className="h-6 w-6" /> Perfil de Tutor
    </h1>
    <p className="text-muted-foreground mb-6">Regístrate como tutor y ofrece tutorías académicas</p>

    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del tutor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre completo</Label>
              <Input defaultValue="María García López" className="mt-1" />
            </div>
            <div>
              <Label>Nivel académico</Label>
              <Select defaultValue="pregrado">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pregrado">Pregrado avanzado</SelectItem>
                  <SelectItem value="posgrado">Posgrado</SelectItem>
                  <SelectItem value="docente">Docente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Carrera</Label>
              <Input defaultValue="Ingeniería de Sistemas" className="mt-1" />
            </div>
            <div>
              <Label>Semestre</Label>
              <Input defaultValue="8vo semestre" className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" /> Materias que puedo dictar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Cálculo I", "Cálculo II", "Álgebra Lineal", "Programación I"].map((s) => (
              <Badge key={s} variant="secondary" className="text-sm py-1 px-3">{s}</Badge>
            ))}
          </div>
          <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar materia</Button>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Horario disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { day: "Lunes", time: "09:00 - 12:00" },
              { day: "Martes", time: "14:00 - 17:00" },
              { day: "Miércoles", time: "09:00 - 11:00" },
              { day: "Jueves", time: "10:00 - 13:00" },
              { day: "Viernes", time: "08:00 - 10:00" },
            ].map((slot) => (
              <div key={slot.day} className="rounded-md border p-2.5 text-xs bg-success/10 border-success/30">
                <div className="font-medium">{slot.day}</div>
                <div className="text-muted-foreground">{slot.time}</div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar horario</Button>
        </CardContent>
      </Card>

      {/* Accessibility support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Accessibility className="h-5 w-5" /> Puedo impartir tutorías a</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="tblind" defaultChecked />
            <Label htmlFor="tblind" className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> Personas ciegas o con baja visión</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="tdeaf" />
            <Label htmlFor="tdeaf" className="flex items-center gap-1.5"><Ear className="h-4 w-4" /> Personas sordas o con baja audición</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="tphysical" defaultChecked />
            <Label htmlFor="tphysical" className="flex items-center gap-1.5"><Accessibility className="h-4 w-4" /> Personas con discapacidad física</Label>
          </div>
        </CardContent>
      </Card>

      {/* Create tutoring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crear nueva tutoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Materia</Label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar materia" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="calculo1">Cálculo I</SelectItem>
                  <SelectItem value="calculo2">Cálculo II</SelectItem>
                  <SelectItem value="algebra">Álgebra Lineal</SelectItem>
                  <SelectItem value="prog1">Programación I</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de salón requerido</Label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquiera</SelectItem>
                  <SelectItem value="accessible">Accesible (silla de ruedas)</SelectItem>
                  <SelectItem value="lab">Laboratorio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" className="mt-1" />
            </div>
          </div>
          <Button className="w-full"><Plus className="h-4 w-4 mr-1" /> Crear tutoría</Button>
        </CardContent>
      </Card>

      <Button className="w-full">Guardar perfil de tutor</Button>
    </div>
  </main>
);

export default TutorProfile;
