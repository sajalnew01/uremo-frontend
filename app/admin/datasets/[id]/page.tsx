"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import ConfirmModal from "@/components/admin/v2/ConfirmModal";

// ── Types ───────────────────────────────────────
interface Dataset {
  _id: string;
  name: string;
  description: string;
  datasetType: string;
  difficultyLevel: string;
  minJustificationWords: number;
  minWordCount: number;
  allowMultiResponseComparison: boolean;
  isActive: boolean;
  createdAt: string;
}

interface DatasetTask {
  _id: string;
  prompt: string;
  responseA: string;
  responseB: string;
  imageUrl: string;
  metadata: any;
  batchId: string;
  correctAnswer: string;
  referenceSources: string[];
  isActive: boolean;
  createdAt: string;
}

const DATASET_TYPES = [
  { value: "ranking", label: "Ranking" },
  { value: "generation", label: "Generation" },
  { value: "red_team", label: "Red Team" },
  { value: "fact_check", label: "Fact Check" },
  { value: "coding", label: "Coding" },
  { value: "multimodal", label: "Multimodal" },
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// ── Main Content ────────────────────────────────
function DatasetEditorContent() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [tasks, setTasks] = useState<DatasetTask[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit dataset
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editMinJust, setEditMinJust] = useState(30);
  const [editMinWords, setEditMinWords] = useState(0);
  const [editMultiResp, setEditMultiResp] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add task
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskPrompt, setTaskPrompt] = useState("");
  const [taskRespA, setTaskRespA] = useState("");
  const [taskRespB, setTaskRespB] = useState("");
  const [taskImgUrl, setTaskImgUrl] = useState("");
  const [taskCorrectAnswer, setTaskCorrectAnswer] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Bulk upload
  const [showBulk, setShowBulk] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  // Delete task
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<DatasetTask | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const loadDataset = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>(
        `/api/admin/datasets/${datasetId}`,
        "GET",
        null,
        true,
      );
      setDataset(res.dataset);
      setTasks(res.tasks || []);
      setSubmissionCount(res.submissionCount || 0);
      // Seed edit form
      if (res.dataset) {
        const d = res.dataset;
        setEditName(d.name);
        setEditDesc(d.description || "");
        setEditType(d.datasetType);
        setEditDifficulty(d.difficultyLevel);
        setEditMinJust(d.minJustificationWords);
        setEditMinWords(d.minWordCount);
        setEditMultiResp(d.allowMultiResponseComparison);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasetId) loadDataset();
  }, [datasetId]);

  const handleSaveDataset = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest(
        `/api/admin/datasets/${datasetId}`,
        "PUT",
        {
          name: editName.trim(),
          description: editDesc,
          datasetType: editType,
          difficultyLevel: editDifficulty,
          minJustificationWords: editMinJust,
          minWordCount: editMinWords,
          allowMultiResponseComparison: editMultiResp,
        },
        true,
      );
      setSuccess("Dataset updated");
      setEditing(false);
      await loadDataset();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskPrompt.trim()) return setError("Prompt is required");
    setAddingTask(true);
    setError(null);
    try {
      await apiRequest(
        `/api/admin/datasets/${datasetId}/tasks`,
        "POST",
        {
          prompt: taskPrompt,
          responseA: taskRespA,
          responseB: taskRespB,
          imageUrl: taskImgUrl,
          correctAnswer: taskCorrectAnswer,
        },
        true,
      );
      setSuccess("Task added");
      setShowAddTask(false);
      setTaskPrompt("");
      setTaskRespA("");
      setTaskRespB("");
      setTaskImgUrl("");
      setTaskCorrectAnswer("");
      await loadDataset();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingTask(false);
    }
  };

  const handleBulkUpload = async () => {
    setBulkUploading(true);
    setError(null);
    try {
      const parsed = JSON.parse(bulkJson);
      const tasksArr = Array.isArray(parsed) ? parsed : parsed.tasks;
      if (!Array.isArray(tasksArr)) throw new Error("JSON must be an array of tasks");
      const res = await apiRequest<any>(
        `/api/admin/datasets/${datasetId}/tasks/bulk`,
        "POST",
        { tasks: tasksArr },
        true,
      );
      setSuccess(`${res.count} tasks uploaded`);
      setShowBulk(false);
      setBulkJson("");
      await loadDataset();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    setDeletingTask(true);
    try {
      await apiRequest(
        `/api/admin/datasets/${datasetId}/tasks/${deleteTaskTarget._id}`,
        "DELETE",
        null,
        true,
      );
      setSuccess("Task deleted");
      setDeleteTaskTarget(null);
      await loadDataset();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingTask(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading dataset...</div>;
  }

  if (!dataset) {
    return <div className="p-6 text-red-400">Dataset not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/admin/datasets" className="hover:text-white transition">
          Datasets
        </Link>
        <span>/</span>
        <span className="text-white">{dataset.name}</span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
          {success}
          <button className="ml-2 underline" onClick={() => setSuccess(null)}>dismiss</button>
        </div>
      )}

      {/* Dataset Header */}
      <div className="bg-[#1e1e2e] border border-[#2a2a3a] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{dataset.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                {dataset.datasetType.replace("_", " ")}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">
                {dataset.difficultyLevel}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${dataset.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                {dataset.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {dataset.description && (
              <p className="text-sm text-gray-400 mt-2">{dataset.description}</p>
            )}
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition"
          >
            {editing ? "Cancel Edit" : "Edit Dataset"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-[#2a2a3a] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{tasks.length}</div>
            <div className="text-xs text-gray-400">Tasks</div>
          </div>
          <div className="bg-[#2a2a3a] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{submissionCount}</div>
            <div className="text-xs text-gray-400">Submissions</div>
          </div>
          <div className="bg-[#2a2a3a] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{dataset.minJustificationWords}</div>
            <div className="text-xs text-gray-400">Min Just. Words</div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="mt-6 border-t border-[#3a3a4a] pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm">
                  {DATASET_TYPES.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)} className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm">
                  {DIFFICULTY_LEVELS.map((dl) => (<option key={dl.value} value={dl.value}>{dl.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Justification Words</label>
                <input type="number" value={editMinJust} onChange={(e) => setEditMinJust(Number(e.target.value))} className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Word Count</label>
                <input type="number" value={editMinWords} onChange={(e) => setEditMinWords(Number(e.target.value))} className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editMultiResp} onChange={(e) => setEditMultiResp(e.target.checked)} className="rounded" />
                <label className="text-sm text-gray-400">Multi-Response Comparison</label>
              </div>
            </div>
            <div className="mt-4">
              <button onClick={handleSaveDataset} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-[#1e1e2e] border border-[#2a2a3a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Tasks ({tasks.length})</h2>
          <div className="flex gap-2">
            <button onClick={() => { setShowAddTask(!showAddTask); setShowBulk(false); }} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">+ Add Task</button>
            <button onClick={() => { setShowBulk(!showBulk); setShowAddTask(false); }} className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">Bulk Upload</button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="mb-4 bg-[#2a2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Add Single Task</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Prompt *</label>
                <textarea value={taskPrompt} onChange={(e) => setTaskPrompt(e.target.value)} rows={3} className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3a3a4a] rounded-lg text-white text-sm" placeholder="Enter the task prompt..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Response A</label>
                  <textarea value={taskRespA} onChange={(e) => setTaskRespA(e.target.value)} rows={2} className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3a3a4a] rounded-lg text-white text-sm" placeholder="Response A text..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Response B</label>
                  <textarea value={taskRespB} onChange={(e) => setTaskRespB(e.target.value)} rows={2} className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3a3a4a] rounded-lg text-white text-sm" placeholder="Response B text..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Image URL (optional)</label>
                  <input value={taskImgUrl} onChange={(e) => setTaskImgUrl(e.target.value)} className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3a3a4a] rounded-lg text-white text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Correct Answer (optional)</label>
                  <input value={taskCorrectAnswer} onChange={(e) => setTaskCorrectAnswer(e.target.value)} className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3a3a4a] rounded-lg text-white text-sm" placeholder="A, B, or custom" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddTask} disabled={addingTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition">{addingTask ? "Adding..." : "Add Task"}</button>
                <button onClick={() => setShowAddTask(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload */}
        {showBulk && (
          <div className="mb-4 bg-[#2a2a3a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Bulk Upload Tasks (JSON)</h3>
            <p className="text-xs text-gray-400 mb-2">
              Paste a JSON array of tasks. Each task needs at minimum: {`{ "prompt": "..." }`}. Optional fields: responseA, responseB, imageUrl, correctAnswer, referenceSources.
            </p>
            <textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} rows={8} className="w-full px-3 py-2 bg-[#1e1e2e] border border-[#3a3a4a] rounded-lg text-white text-sm font-mono" placeholder={`[\n  { "prompt": "Which response is better?", "responseA": "...", "responseB": "..." },\n  { "prompt": "Rate this output", "responseA": "..." }\n]`} />
            <div className="flex gap-2 mt-2">
              <button onClick={handleBulkUpload} disabled={bulkUploading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition">{bulkUploading ? "Uploading..." : "Upload Tasks"}</button>
              <button onClick={() => setShowBulk(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No tasks yet. Add tasks manually or bulk upload.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, idx) => (
              <div key={task._id} className="bg-[#2a2a3a] rounded-lg p-4 hover:bg-[#323242] transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">#{idx + 1}</span>
                      {!task.isActive && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-white">{task.prompt}</p>
                    {(task.responseA || task.responseB) && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {task.responseA && (
                          <div className="bg-[#1e1e2e] rounded p-2">
                            <div className="text-xs text-gray-500 mb-1">Response A</div>
                            <div className="text-xs text-gray-300 line-clamp-3">{task.responseA}</div>
                          </div>
                        )}
                        {task.responseB && (
                          <div className="bg-[#1e1e2e] rounded p-2">
                            <div className="text-xs text-gray-500 mb-1">Response B</div>
                            <div className="text-xs text-gray-300 line-clamp-3">{task.responseB}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {task.imageUrl && (
                      <div className="mt-1 text-xs text-gray-500">Image: {task.imageUrl.slice(0, 60)}...</div>
                    )}
                  </div>
                  <button onClick={() => setDeleteTaskTarget(task)} className="ml-3 px-2 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Task Confirmation */}
      {deleteTaskTarget && (
        <ConfirmModal
          open={!!deleteTaskTarget}
          title="Delete Task"
          description={`Delete task "${deleteTaskTarget.prompt.slice(0, 60)}..."?`}
          onConfirm={handleDeleteTask}
          onClose={() => setDeleteTaskTarget(null)}
          loading={deletingTask}
          variant="danger"
        />
      )}
    </div>
  );
}

export default function DatasetEditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
      <DatasetEditorContent />
    </Suspense>
  );
}
