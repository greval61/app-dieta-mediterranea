import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Utensils, Sun, Moon, Coffee, Download, Plus, Trash2, Search, X, Copy, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { persistence } from '../services/persistence';
import AddFoodModal from './AddFoodModal';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyLog, setDailyLog] = useState({ breakfast: [], lunch: [], snack: [], dinner: [] });
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para añadir alimentos
  const [activeMeal, setActiveMeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [foodCatalog, setFoodCatalog] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState('100');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFoodModal, setShowCreateFoodModal] = useState(false);
  
  // Estados para editar cantidad de alimentos
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [goals, setGoals] = useState(() => persistence.getGoals());
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const calculateGoalsFromProfile = (profile) => {
    const weight = Number(profile.weight) || 0;
    const height = Number(profile.height) || 0;
    const age = Number(profile.age) || 0;
    const sex = profile.sex || 'female';
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const objectiveAdjustments = {
      lose: -400,
      maintain: 0,
      gain: 250,
    };

    const bmr = weight && height && age
      ? 10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161)
      : 0;

    const activity = activityFactors[profile.activity] || activityFactors.moderate;
    const adjustment = objectiveAdjustments[profile.objective] || 0;
    const tdee = Math.max(1200, Math.round(bmr * activity + adjustment));

    const proteinMultiplier = profile.objective === 'lose'
      ? 2.0
      : profile.objective === 'gain'
      ? 2.2
      : 1.8;

    const protein = Math.max(0, Math.round((proteinMultiplier * weight) * 10) / 10);
    const fat = Math.max(0, Math.round(((tdee * 0.25) / 9) * 10) / 10);
    const carbs = Math.max(0, Math.round(((tdee - protein * 4 - fat * 9) / 4) * 10) / 10);

    return {
      calories: tdee,
      protein,
      carbs,
      fat,
    };
  };

  const displayGoals = {
    ...goals,
    ...calculateGoalsFromProfile(goals.profile || {}),
  };

  const getPastDates = (date, amount = 7) => {
    const result = [];
    const base = new Date(date);
    for (let i = amount - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      result.push(d);
    }
    return result;
  };

  const fetchHistory = async (baseDate = selectedDate) => {
    setHistoryLoading(true);
    try {
      const dates = getPastDates(baseDate, 7);

      const data = await Promise.all(dates.map(async (date) => {
        try {
          const logs = await persistence.getLogs(formatDateStr(date));
          const totals = calculateTotals(logs);
          return {
            day: date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
          };
        } catch (err) {
          console.error('Error fetching logs for date:', err);
          return {
            day: date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          };
        }
      }));

      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getHistoryTotals = () => {
    return history.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const getHistoryStatus = (value, target) => {
    if (target === 0) return 'neutral';
    const ratio = value / target;
    if (ratio < 0.9) return 'low';
    if (ratio > 1.1) return 'high';
    return 'good';
  };

  const weeklyTotals = getHistoryTotals();
  const weeklyGoals = {
    calories: (displayGoals.calories || 0) * 7,
    protein: (displayGoals.protein || 0) * 7,
    carbs: (displayGoals.carbs || 0) * 7,
    fat: (displayGoals.fat || 0) * 7,
  };
  const weeklyAverage = history.length > 0 ? {
    calories: weeklyTotals.calories / history.length,
    protein: weeklyTotals.protein / history.length,
    carbs: weeklyTotals.carbs / history.length,
    fat: weeklyTotals.fat / history.length,
  } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Semana comienza en lunes (España)
  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Obtener el primer día de la semana (0=Domingo -> convertir a 6, 1=Lunes -> 0, etc.)
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convertir: Domingo=6, Lunes=0, Martes=1...
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isSameDay = (date1, date2) => {
    return date1 && date2 && 
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  const isToday = (date) => {
    return isSameDay(date, new Date());
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchHistory();
  }, [selectedDate]);

  useEffect(() => {
    if (showAddModal) {
      persistence.getFoods(searchTerm).then(setFoodCatalog).catch(err => {
        console.error('Error loading foods:', err);
        setFoodCatalog([]);
      });
    }
  }, [searchTerm, showAddModal]);

  const fetchLogs = async () => {
    const dateStr = formatDateStr(selectedDate);
    setLoading(true);
    try {
      const data = await persistence.getLogs(dateStr);
      const organized = {
        breakfast: data.filter(l => l.meal_id === 'breakfast'),
        lunch: data.filter(l => l.meal_id === 'lunch'),
        snack: data.filter(l => l.meal_id === 'snack'),
        dinner: data.filter(l => l.meal_id === 'dinner'),
      };
      setDailyLog(organized);
      setApiError(null);
    } catch (error) {
      setApiError('No se pudo conectar con el servidor. Usando datos locales.');
      setDailyLog({ breakfast: [], lunch: [], snack: [], dinner: [] });
    } finally {
      setLoading(false);
    }
  };

  const removeFoodFromMeal = async (id) => {
    try {
      await persistence.deleteLog(id, formatDateStr(selectedDate));
      await fetchLogs();
      await fetchHistory();
    } catch (error) {
      console.error('Error removing food:', error);
      setApiError('No se pudo eliminar el alimento.');
    }
  };

  const updateFoodAmount = async (item) => {
    try {
      const updatedLog = await persistence.updateLog(item.id, editAmount);
      if (updatedLog) {
        await fetchLogs();
        await fetchHistory();
        setShowEditModal(false);
        setEditingItem(null);
        setEditAmount('');
      } else {
        setApiError('No se pudo actualizar la cantidad del alimento.');
      }
    } catch (error) {
      console.error('Error updating food amount:', error);
      setApiError('No se pudo actualizar la cantidad del alimento.');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString());
    setShowEditModal(true);
  };

  const handleFoodCreated = async (newFood) => {
    try {
      const data = await persistence.getFoods('');
      setFoodCatalog(data);
      setSelectedFood(newFood);
      setSearchTerm('');
    } catch (error) {
      console.error('Error loading foods after creation:', error);
      setSelectedFood(newFood);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!selectedFood || !activeMeal) return;

    setIsSaving(true);
    const dateStr = formatDateStr(selectedDate);
    const parsedAmount = parseFloat(amount) || 0;
    const isWeightBased = Number(selectedFood.is_weight_based) === 1;
    const factor = isWeightBased ? parsedAmount / 100 : parsedAmount;

    try {
      await persistence.saveLog({
        date: dateStr,
        meal_id: activeMeal,
        food_id: selectedFood.id,
        name: selectedFood.name,
        amount: parsedAmount,
        calories: selectedFood.calories * factor,
        protein: selectedFood.protein * factor,
        carbs: selectedFood.carbs * factor,
        fat: selectedFood.fat * factor,
        sugar: (selectedFood.sugar || 0) * factor,
        unit_label: isWeightBased ? 'g' : 'unid.'
      });

      await fetchLogs();
      await fetchHistory();
      setShowAddModal(false);
      setSelectedFood(null);
      setSearchTerm('');
      setAmount('100');
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyDayToDate = async (sourceDateStr, targetDateStr) => {
    if (!sourceDateStr || !targetDateStr) return;
    
    setLoading(true);
    try {
      const sourceLogs = await persistence.getLogs(sourceDateStr);
      if (sourceLogs.length === 0) {
        alert('No hay registros en el día de origen para copiar.');
        return;
      }

      for (const log of sourceLogs) {
        await persistence.saveLog({
          ...log,
          id: null,
          date: targetDateStr
        });
      }
      
      if (formatDateStr(selectedDate) === targetDateStr) {
        await fetchLogs();
      }
      alert('¡Día copiado con éxito!');
    } catch (error) {
      alert('Error al copiar el día: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items) => {
    return items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      sugar: acc.sugar + item.sugar,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });
  };

  const dayTotals = calculateTotals(Object.values(dailyLog).flat());
  const totalItems = Object.values(dailyLog).flat().length;

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDate, setCopyCopySourceDate] = useState(formatDateStr(new Date()));

  const mealIcons = { breakfast: Sun, lunch: Utensils, snack: Coffee, dinner: Moon };
  const mealNames = { breakfast: 'Desayuno', lunch: 'Comida', snack: 'Merienda', dinner: 'Cena' };
  const mealIds = ['breakfast', 'lunch', 'snack', 'dinner'];

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Calcular totales con datos actuales para evitar datos desactualizados
      const currentDayTotals = calculateTotals(Object.values(dailyLog).flat());

      
      const dateStr = selectedDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      // Header elegante
      doc.setFillColor(106, 153, 78); // med-olive
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('Vida Mediterránea', 15, 12);
      
      doc.setFontSize(10);
      doc.setTextColor(200, 210, 190);
      doc.text('Registro Nutricional Diario', 15, 19);

      let currentY = 35;

      // Fecha y calorías totales - en una sección destacada
      doc.setFillColor(245, 248, 245); // fondo muy claro
      doc.rect(15, currentY - 5, pageWidth - 30, 18, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), 20, currentY + 2);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(106, 153, 78);
      doc.text(`${currentDayTotals.calories.toFixed(0)} kcal`, pageWidth - 25, currentY + 5, { align: 'right' });
      
      currentY += 25;

      // Macronutrientes - en cuadro con colores
      const macroBoxWidth = (pageWidth - 40) / 4;
      const macroY = currentY;
      const macroHeight = 20;
      
      const macros = [
        { label: 'Proteínas', value: currentDayTotals.protein.toFixed(1), color: [30, 100, 200] },
        { label: 'Hidratos', value: currentDayTotals.carbs.toFixed(1), color: [220, 150, 20] },
        { label: 'Grasas', value: currentDayTotals.fat.toFixed(1), color: [200, 40, 40] },
        { label: 'Azúcares', value: currentDayTotals.sugar.toFixed(1), color: [150, 80, 180] }
      ];

      macros.forEach((macro, index) => {
        const xPos = 20 + index * (macroBoxWidth + 5);
        
        // Fondo coloreado
        doc.setFillColor(...macro.color);
        doc.rect(xPos, macroY, macroBoxWidth, macroHeight, 'F');
        
        // Texto
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(macro.label, xPos + macroBoxWidth / 2, macroY + 6, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(`${macro.value}g`, xPos + macroBoxWidth / 2, macroY + 15, { align: 'center' });
      });

      currentY += macroHeight + 12;

      // Tabla de comidas con mejor diseño
      if (Object.values(dailyLog).flat().length > 0) {
        // Crear tabla por comidas en lugar de todo junto
        Object.entries(dailyLog).forEach(([mealId, items]) => {
          if (items.length === 0) return;

          // Encabezado de la comida
          const mealTotal = calculateTotals(items);
          doc.setFillColor(240, 245, 240);
          doc.rect(15, currentY - 2, pageWidth - 30, 8, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(106, 153, 78);
          doc.text(mealNames[mealId].toUpperCase(), 20, currentY + 3);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`${mealTotal.calories.toFixed(0)} kcal • P: ${mealTotal.protein.toFixed(1)}g • H: ${mealTotal.carbs.toFixed(1)}g • G: ${mealTotal.fat.toFixed(1)}g • Az: ${mealTotal.sugar.toFixed(1)}g`, 
            pageWidth - 20, currentY + 3, { align: 'right' });

          currentY += 10;

          // Tabla de alimentos de esta comida
          const mealTableData = items.map(item => [
            item.name,
            `${item.amount}${item.unit_label || 'g'}`,
            item.protein.toFixed(1),
            item.carbs.toFixed(1),
            item.fat.toFixed(1),
            item.sugar.toFixed(1),
            item.calories.toFixed(0)
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Alimento', 'Cantidad', 'Prot (g)', 'HC (g)', 'Grasas (g)', 'Azúcar (g)', 'Kcal']],
            body: mealTableData,
            theme: 'grid',
            headStyles: {
              fillColor: [106, 153, 78],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 8,
              textColor: [50, 50, 50]
            },
            alternateRowStyles: {
              fillColor: [245, 248, 245]
            },
            margin: { left: 15, right: 15, top: 2, bottom: 2 },
            columnStyles: {
              0: { cellWidth: 45, halign: 'left' },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 18, halign: 'center' },
              3: { cellWidth: 18, halign: 'center' },
              4: { cellWidth: 18, halign: 'center' },
              5: { cellWidth: 18, halign: 'center' },
              6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
            }
          });

          currentY = doc.lastAutoTable.finalY + 8;
        });
      } else {
        // Mostrar mensaje cuando no hay datos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('No hay alimentos registrados para este día.', pageWidth / 2, currentY + 20, { align: 'center' });
      }

      // Footer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 15, pageHeight - 10);
      doc.text('Dieta Mediterránea © 2026', pageWidth - 15, pageHeight - 10, { align: 'right' });

      const fileName = `registro_${formatDateStr(selectedDate)}.pdf`;
      
      if (Capacitor.isNativePlatform()) {
        try {
          const base64data = doc.output('datauristring').split(',')[1];
          let savedFile;

          try {
            savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Documents
            });
          } catch (permError) {
            console.warn('Error al guardar en Documents, intentando en Cache:', permError);
            savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Cache
            });
          }

          await Share.share({
            title: fileName,
            url: savedFile.uri,
          });
        } catch (shareError) {
          console.error('Error al compartir PDF:', shareError);
          alert('PDF guardado en la aplicación. Para compartirlo, usa la función compartir de Android.');
        }
      } else {
        doc.save(fileName);
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF: ' + error.message);
    }
  };

  const exportWeeklyPDF = async () => {
    try {
      setLoading(true);
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Calcular totales con datos actuales para evitar datos desactualizados
      const currentDayTotals = calculateTotals(Object.values(dailyLog).flat());


      // Calcular rango de la semana (Lunes a Domingo)
      const current = new Date(selectedDate);
      const day = current.getDay();
      const diff = current.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(current.getFullYear(), current.getMonth(), diff);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(formatDateStr(d));
      }

      // Header
      doc.setFillColor(106, 153, 78);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('Resumen Semanal Nutricional', 15, 15);
      doc.setFontSize(10);
      doc.text(`Semana del ${weekDates[0]} al ${weekDates[6]}`, 15, 22);

      let currentY = 40;
      let weekTotalCalories = 0;
      let daysWithData = 0;

      const mealOrder = { breakfast: 1, lunch: 2, snack: 3, dinner: 4 };
      const mealNamesLocal = { breakfast: 'Desayuno', lunch: 'Comida', snack: 'Merienda', dinner: 'Cena' };

      for (const dateStr of weekDates) {
        let data = await persistence.getLogs(dateStr);
        if (data.length === 0) continue;

        data.sort((a, b) => (mealOrder[a.meal_id] || 99) - (mealOrder[b.meal_id] || 99));
        daysWithData++;
        const dTotals = calculateTotals(data);
        weekTotalCalories += dTotals.calories;

        doc.setFillColor(240, 245, 240);
        doc.rect(15, currentY, pageWidth - 30, 10, 'F');
        doc.setFontSize(11);
        doc.setTextColor(106, 153, 78);
        const dObj = new Date(dateStr + 'T12:00:00');
        const dayName = dObj.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' });
        doc.text(dayName.toUpperCase(), 20, currentY + 7);
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`${dTotals.calories.toFixed(0)} kcal`, pageWidth - 20, currentY + 7, { align: 'right' });
        currentY += 15;

        const tableData = data.map(item => [
          mealNamesLocal[item.meal_id] || item.meal_id,
          item.name,
          `${item.amount}${item.unit_label || 'g'}`,
          `${item.calories.toFixed(0)} kcal`
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Comida', 'Alimento', 'Cant.', 'Kcal']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [106, 153, 78], fontSize: 8 },
          styles: { fontSize: 8 },
          margin: { left: 20, right: 20 }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 20;
        }
      }

      if (daysWithData > 0) {
        if (currentY > pageHeight - 60) doc.addPage();
        currentY += 10;
        doc.setFillColor(106, 153, 78);
        doc.rect(15, currentY, pageWidth - 30, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('RESUMEN DE LA SEMANA', pageWidth / 2, currentY + 10, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Calorías Totales: ${weekTotalCalories.toFixed(0)} kcal`, 25, currentY + 18);
        doc.text(`Promedio Diario: ${(weekTotalCalories / daysWithData).toFixed(0)} kcal/día`, pageWidth - 25, currentY + 18, { align: 'right' });
      } else {
        doc.setTextColor(100, 100, 100);
        doc.text('No hay datos registrados para esta semana.', 20, currentY);
      }

      const fileName = `resumen_semanal_${weekDates[0]}.pdf`;
      
      if (Capacitor.isNativePlatform()) {
        try {
          const base64data = doc.output('datauristring').split(',')[1];
          let savedFile;

          try {
            savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Documents
            });
          } catch (permError) {
            console.warn('Error al guardar en Documents, intentando en Cache:', permError);
            savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Cache
            });
          }

          await Share.share({
            title: fileName,
            url: savedFile.uri,
          });
        } catch (shareError) {
          console.error('Error al compartir PDF:', shareError);
          alert('PDF guardado en la aplicación. Para compartirlo, usa la función compartir de Android.');
        }
      } else {
        doc.save(fileName);
      }
    } catch (error) {
      console.error(error);
      alert('Error al generar resumen semanal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Modal para copiar día completo */}
      {showCopyModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-med-slate/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-med-slate">Copiar todo el día</h3>
              <button onClick={() => setShowCopyModal(false)} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-slate-500">
              Selecciona el día de origen cuyos alimentos quieres copiar al día seleccionado (<strong>{formatDateStr(selectedDate)}</strong>).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase block">Día de origen</label>
              <input
                type="date"
                value={copySourceDate}
                onChange={(e) => setCopyCopySourceDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-med-blue rounded-xl outline-none font-bold"
              />
            </div>

            <button
              onClick={() => {
                copyDayToDate(copySourceDate, formatDateStr(selectedDate));
                setShowCopyModal(false);
              }}
              className="w-full py-4 bg-med-blue text-white rounded-xl font-bold hover:bg-med-slate transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Copy size={18} /> Copiar ahora
            </button>
          </div>
        </div>
      )}

      {/* Modal para añadir alimentos */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-med-slate/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-med-slate">Añadir a {mealNames[activeMeal]}</h3>
              <button onClick={() => { setShowAddModal(false); setSelectedFood(null); setSearchTerm(''); }} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            {!selectedFood ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar alimento..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-med-olive rounded-xl outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {foodCatalog.map(food => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => setSelectedFood(food)}
                      className="w-full text-left p-3 hover:bg-med-offwhite rounded-xl border border-transparent hover:border-med-olive/20 transition-all flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-sm">{food.name}</p>
                        <p className="text-xs text-slate-400">{food.calories} kcal / {Number(food.is_weight_based) === 1 ? '100g' : 'unid.'}</p>
                      </div>
                      <Plus size={16} className="text-med-olive" />
                    </button>
                  ))}
                  
                  {searchTerm && foodCatalog.length === 0 && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-slate-400 text-sm italic">No se encontraron alimentos para «{searchTerm}»</p>
                      <button
                        type="button"
                        onClick={() => setShowCreateFoodModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-med-olive text-white rounded-lg font-bold text-xs hover:bg-med-slate transition-colors shadow"
                      >
                        <Plus size={14} />
                        Dar de alta este alimento
                      </button>
                    </div>
                  )}

                  {!searchTerm && foodCatalog.length === 0 && (
                    <p className="text-center py-4 text-slate-400 text-sm italic">Cargando catálogo...</p>
                  )}
                </div>

                {!searchTerm && (
                  <button
                    type="button"
                    onClick={() => setShowCreateFoodModal(true)}
                    className="w-full py-2.5 text-xs font-bold text-med-olive hover:bg-med-olive/10 rounded-lg border border-dashed border-med-olive/30 transition-colors"
                  >
                    + Crear alimento nuevo en la base de datos
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddFood} className="space-y-6">
                <div className="bg-med-offwhite p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Seleccionado</p>
                  <p className="font-bold text-med-slate">{selectedFood.name}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                    Cantidad ({selectedFood.is_weight_based ? 'gramos' : 'unidades'})
                  </label>
                  <input
                    autoFocus
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 bg-med-offwhite border-2 border-transparent focus:border-med-olive rounded-xl outline-none font-bold text-xl"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-4 bg-med-olive text-white rounded-xl font-bold hover:bg-med-slate transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Añadir'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header minimal */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-med-slate">Calendario</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportWeeklyPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-med-olive text-white rounded-xl font-bold text-sm hover:bg-med-slate transition-all shadow-lg active:scale-95 disabled:opacity-50"
            title="Exportar semana completa a PDF"
          >
            <FileText size={16} />
            <span>Resumen Semanal</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white text-med-olive border-2 border-med-olive rounded-xl font-bold text-sm hover:bg-med-offwhite transition-all active:scale-95"
          >
            <Download size={16} />
            <span>Día actual</span>
          </button>
        </div>
      </div>

      {/* Calendario muy compacto - ancho fijo pequeño */}
      <div className="w-fit">
        <div className="bg-white rounded-lg border border-med-blue-light p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateMonth(-1)} className="p-1 hover:text-med-olive">
              <ChevronLeft size={20} />
            </button>
            <span className="text-base font-bold text-med-slate">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={() => navigateMonth(1)} className="p-1 hover:text-med-olive">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-sm font-bold text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {generateCalendarDays().map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
              
              const isSelected = isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    aspect-square rounded flex items-center justify-center text-base font-medium transition-all
                    ${isSelected 
                      ? 'bg-med-olive text-white' 
                      : isTodayDate 
                        ? 'bg-med-terracotta/20 text-med-terracotta font-bold' 
                        : 'hover:bg-med-offwhite text-slate-600'
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-xl border border-med-blue-light p-4">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <span className="text-base font-bold text-med-slate capitalize">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-med-blue text-white rounded-lg font-bold text-xs hover:bg-med-slate transition-colors"
              title="Copiar datos de otro día"
            >
              <Copy size={12} />
              Copiar día
            </button>
            <span className="text-2xl font-black text-med-olive">{dayTotals.calories.toFixed(0)} kcal</span>
            {totalItems > 0 && (
              <button
                onClick={exportToPDF}
                className="flex items-center gap-1 px-3 py-1.5 bg-med-olive text-white rounded-lg font-bold text-xs hover:bg-med-slate transition-colors"
              >
                <Download size={12} />
                PDF
              </button>
            )}
          </div>
        </div>

        {/* Macronutrientes totales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col items-center">
            <span className="text-[10px] font-black text-blue-400 uppercase">Proteínas</span>
            <span className="text-lg font-black text-blue-700">{dayTotals.protein.toFixed(1)}g</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex flex-col items-center">
            <span className="text-[10px] font-black text-amber-400 uppercase">Hidratos</span>
            <span className="text-lg font-black text-amber-700">{dayTotals.carbs.toFixed(1)}g</span>
          </div>
          <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col items-center">
            <span className="text-[10px] font-black text-red-400 uppercase">Grasas</span>
            <span className="text-lg font-black text-red-700">{dayTotals.fat.toFixed(1)}g</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col items-center">
            <span className="text-[10px] font-black text-purple-400 uppercase">Azúcares</span>
            <span className="text-lg font-black text-purple-700">{dayTotals.sugar.toFixed(1)}g</span>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[0.95fr_1.05fr] mb-4">
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Comparativa</p>
                <h3 className="text-lg font-black text-med-slate">Consumo vs objetivo</h3>
              </div>
              <span className="text-xs text-slate-400">Actual</span>
            </div>

            <div className="space-y-3">
              {[
                { key: 'calories', label: 'Calorías', unit: 'kcal', color: 'bg-med-olive/10 text-med-olive' },
                { key: 'protein', label: 'Proteínas', unit: 'g', color: 'bg-blue-50 text-blue-700' },
                { key: 'carbs', label: 'Hidratos', unit: 'g', color: 'bg-amber-50 text-amber-700' },
                { key: 'fat', label: 'Grasas', unit: 'g', color: 'bg-red-50 text-red-700' },
              ].map(({ key, label, unit, color }) => {
                const actual = dayTotals[key];
                const target = displayGoals[key] || 0;
                const ratio = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
                const diff = actual - target;

                return (
                  <div key={key} className="rounded-3xl bg-white border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">{label}</p>
                        <p className="text-sm text-slate-500">Meta {target.toFixed(0)} {unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black">{actual.toFixed(key === 'calories' ? 0 : 1)} {unit}</p>
                        <p className={`text-[11px] ${diff > 0 ? 'text-red-600' : 'text-med-olive'}`}>
                          {diff > 0 ? `+${diff.toFixed(0)} sobre` : `${Math.abs(diff).toFixed(0)} faltan`}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-500">Tendencia</p>
                <h3 className="text-lg font-black text-med-slate">Últimos 7 días</h3>
              </div>
              <span className="text-xs text-slate-400">Cal / P / H / G</span>
            </div>
            {historyLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Cargando datos de la semana...</div>
            ) : (
              <div className="w-full min-w-0 h-80">
                <ResponsiveContainer width="100%" height={320} minWidth={0}>
                  <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#64748b" />
                    <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
                    <Tooltip formatter={(value) => value.toFixed(0)} />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" dataKey="calories" stroke="#4f7f4f" fill="#d9f2d9" name="Calorías" />
                    <Area type="monotone" dataKey="protein" stroke="#1d4ed8" fill="#dbeafe" name="Proteínas" />
                    <Area type="monotone" dataKey="carbs" stroke="#d97706" fill="#ffedd5" name="Hidratos" />
                    <Area type="monotone" dataKey="fat" stroke="#b91c1c" fill="#fee2e2" name="Grasas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 mb-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-500">Resumen semanal</p>
                <h3 className="text-lg font-black text-med-slate">Semana vs objetivo</h3>
              </div>
              <span className="text-xs text-slate-400">7 días</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: 'calories', label: 'Calorías', unit: 'kcal', color: 'bg-med-olive/10 text-med-olive' },
                { key: 'protein', label: 'Proteínas', unit: 'g', color: 'bg-blue-50 text-blue-700' },
                { key: 'carbs', label: 'Hidratos', unit: 'g', color: 'bg-amber-50 text-amber-700' },
                { key: 'fat', label: 'Grasas', unit: 'g', color: 'bg-red-50 text-red-700' },
              ].map(({ key, label, unit, color }) => {
                const total = weeklyTotals[key];
                const target = weeklyGoals[key];
                const status = getHistoryStatus(total, target);
                const statusClass = status === 'good' ? 'bg-emerald-100 text-emerald-700' : status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

                return (
                  <div key={key} className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-slate-500">{label}</p>
                        <p className="text-xs text-slate-400">Meta {target.toFixed(0)} {unit}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusClass}`}>
                        {status === 'good' ? 'Bien' : status === 'low' ? 'Bajo' : 'Alto'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-2xl font-black text-med-slate">{total.toFixed(key === 'calories' ? 0 : 1)}</p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{weeklyAverage[key].toFixed(key === 'calories' ? 0 : 1)}</p>
                        <p className="text-xs text-slate-400">Media diaria</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-500">Estado semanal</p>
                <h3 className="text-lg font-black text-med-slate">Semáforo rápido</h3>
              </div>
              <span className="text-xs text-slate-400">Meta / real</span>
            </div>
            <div className="grid gap-3">
              {[
                { key: 'calories', label: 'Calorías' },
                { key: 'protein', label: 'Proteínas' },
                { key: 'carbs', label: 'Hidratos' },
                { key: 'fat', label: 'Grasas' },
              ].map(({ key, label }) => {
                const total = weeklyTotals[key];
                const target = weeklyGoals[key];
                const status = getHistoryStatus(total, target);
                const dotClass = status === 'good' ? 'bg-emerald-500' : status === 'low' ? 'bg-amber-500' : 'bg-red-500';

                return (
                  <div key={key} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-med-slate">{label}</p>
                      <p className="text-xs text-slate-400">{target.toFixed(0)} / {total.toFixed(0)}</p>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${dotClass}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4 text-sm text-slate-400">Cargando...</div>
        ) : (
          <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
            {Object.entries(dailyLog).map(([mealId, items]) => {
              const Icon = mealIcons[mealId];
              const mealTotal = calculateTotals(items);
              
              return (
                <div key={mealId} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-med-olive" />
                      <span className="text-base font-bold">{mealNames[mealId]}</span>
                    </div>
                    <button 
                      onClick={() => { setActiveMeal(mealId); setShowAddModal(true); }}
                      className="p-1.5 bg-med-olive text-white rounded-lg hover:scale-110 transition-all active:scale-95 flex items-center justify-center"
                      title="Añadir alimento a este día"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  {/* Macros del tramo */}
                  <div className="grid grid-cols-4 gap-2 mb-3 px-2 py-2 bg-white rounded border border-slate-200">
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-blue-600 uppercase block">P</span>
                      <span className="text-sm font-black text-blue-700">{mealTotal.protein.toFixed(1)}g</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-amber-600 uppercase block">H</span>
                      <span className="text-sm font-black text-amber-700">{mealTotal.carbs.toFixed(1)}g</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-red-600 uppercase block">G</span>
                      <span className="text-sm font-black text-red-700">{mealTotal.fat.toFixed(1)}g</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-purple-600 uppercase block">Az</span>
                      <span className="text-sm font-black text-purple-700">{mealTotal.sugar.toFixed(1)}g</span>
                    </div>
                  </div>

                  {/* Alimentos */}
                  <div className="space-y-3">
                    {items.length > 0 ? (
                      items.map(item => (
                        <div key={item.id} className="border-l-4 border-med-olive pl-3 py-2 group relative bg-white rounded-lg shadow-sm p-3 border border-slate-100">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-med-slate">{item.name}</p>
                              <p className="text-xs text-slate-500 font-medium">{item.amount}{item.unit_label || 'g'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-base font-black text-med-slate">{item.calories.toFixed(0)} kcal</span>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => openEditModal(item)}
                                  className="text-slate-300 hover:text-blue-500 transition-colors"
                                  title="Editar cantidad"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => removeFoodFromMeal(item.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <span className="text-blue-600 font-semibold">P: {item.protein.toFixed(1)}g</span>
                            <span className="text-amber-600 font-semibold">H: {item.carbs.toFixed(1)}g</span>
                            <span className="text-red-600 font-semibold">G: {item.fat.toFixed(1)}g</span>
                            <span className="text-purple-600 font-semibold">Az: {item.sugar.toFixed(1)}g</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-2 text-slate-400 italic text-xs">Sin alimentos registrados</p>
                    )}
                  </div>
                  
                  {/* Total del tramo */}
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Total {mealNames[mealId]}</span>
                    <span className="text-sm font-black text-med-slate">{mealTotal.calories.toFixed(0)} kcal</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddFoodModal
        isOpen={showCreateFoodModal}
        initialName={searchTerm}
        onClose={() => setShowCreateFoodModal(false)}
        onSaved={handleFoodCreated}
      />
    </div>
  );
};

export default Calendar;
