with open('src/components/Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Añadir modal de edición después del modal de goals
old_code = """        </div>
      )}
      <AddFoodModal"""

new_code = """        </div>
      )}

      {/* Modal para editar cantidad de alimento */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-med-slate/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-med-slate">Editar cantidad</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-red-500">
                ×
              </button>
            </div>

            <div className="bg-med-offwhite p-4 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Alimento</p>
              <p className="font-bold text-med-slate">{editingItem.name}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Nueva cantidad ({editingItem.unit_label || 'g'})
              </label>
              <input
                autoFocus
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full p-4 bg-med-offwhite border-2 border-transparent focus:border-med-olive rounded-xl outline-none font-bold text-xl"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => updateFoodAmount(editingItem)}
                className="flex-[2] py-4 bg-med-blue text-white rounded-xl font-bold hover:bg-med-slate transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <AddFoodModal"""

content = content.replace(old_code, new_code)

with open('src/components/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Modal de edición añadido')
