// Adaptador para transformar datos entre backend y frontend

export const adaptAnalyticsData = (backendData) => {
  return {
    totalReportes: backendData.total_reportes || 0,
    reportesHoy: backendData.reportes_hoy || 0,
    totalIncidencias: backendData.total_incidencias_mes || 0,
    totalMovimientos: backendData.total_movimientos || 0,
    administradoresActivos: backendData.administradores_activos || 0,
    promedioHorasDiarias: backendData.promedio_horas_diarias || 0
  }
}

export const adaptReportsListData = (backendReports) => {
  if (!Array.isArray(backendReports)) {
    return []
  }
  
  return backendReports.map(report => ({
    id: report.ID,
    fecha_creacion: report.Fecha_Creacion,
    administrador: report.Administrador,
    cliente_operacion: report.Cliente_Operacion,
    horas_diarias: report.Horas_Diarias,
    personal_staff: report.Personal_Staff,
    personal_base: report.Personal_Base,
    cantidad_incidencias: report.Cantidad_Incidencias,
    cantidad_ingresos_retiros: report.Cantidad_Ingresos_Retiros,
    hechos_relevantes: report.Hechos_Relevantes,
    estado: report.Estado,
    incidencias: report.incidencias || [],
    ingresos_retiros: report.ingresos_retiros || []
  }))
}

export const adaptReportDetailData = (backendReport) => {
  if (!backendReport) return null
  
  return {
    id: backendReport.ID,
    fecha_creacion: backendReport.Fecha_Creacion,
    administrador: backendReport.Administrador,
    cliente_operacion: backendReport.Cliente_Operacion,
    horas_diarias: backendReport.Horas_Diarias,
    personal_staff: backendReport.Personal_Staff,
    personal_base: backendReport.Personal_Base,
    cantidad_incidencias: backendReport.Cantidad_Incidencias,
    cantidad_ingresos_retiros: backendReport.Cantidad_Ingresos_Retiros,
    hechos_relevantes: backendReport.Hechos_Relevantes,
    estado: backendReport.Estado,
    incidencias: backendReport.incidencias || [],
    ingresos_retiros: backendReport.ingresos_retiros || []
  }
}