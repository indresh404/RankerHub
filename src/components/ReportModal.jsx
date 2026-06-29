import { useState } from "react";
import { reportUser } from "../services/reportService";

const REASONS = ["Fake Profile", "Spam", "Abusive Content", "Other"];

const ReportModal = ({ reportedUid, reporterUid, onClose, toast }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await reportUser(reporterUid, reportedUid, reason);
      toast.success("Report submitted. Thank you!");
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-80 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Report User</h2>
        <p className="text-sm text-gray-500 mb-3">Select a reason:</p>

        {REASONS.map((r) => (
          <label
            key={r}
            className="flex items-center gap-2 mb-2 cursor-pointer"
          >
            <input
              type="radio"
              name="reason"
              value={r}
              onChange={() => setReason(r)}
            />
            <span className="text-sm">{r}</span>
          </label>
        ))}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
