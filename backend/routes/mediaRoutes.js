const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect, authorize, authorizePermission } = require("../middleware/auth");
const {
  uploadMedia,
  getAllMedia,
  deleteMedia,
  syncExistingUploads,
  uploadByUrls,
  getMediaById,
  updateMedia,
  bulkDeleteMedia
} = require("../controllers/mediaController");

router.use(protect);

router.get("/", authorizePermission("media", "view"), getAllMedia);
router.get("/:id", authorizePermission("media", "view"), getMediaById);
router.put("/:id", authorizePermission("media", "edit"), updateMedia);
router.post("/upload", authorizePermission("media", "create"), upload.any(), uploadMedia);
router.post("/upload-urls", authorizePermission("media", "create"), uploadByUrls);
router.post("/sync", authorizePermission("media", "create"), syncExistingUploads);
router.post("/bulk-delete", authorizePermission("media", "delete"), bulkDeleteMedia);
router.delete("/:id", authorizePermission("media", "delete"), deleteMedia);

module.exports = router;
