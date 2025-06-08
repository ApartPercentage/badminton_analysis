# api/urls.py

from django.urls import path
from .views import UploadFileView, AnalyzeMatchView

urlpatterns = [
    path('upload/', UploadFileView.as_view(), name='upload_file'),
    path('analyze/', AnalyzeMatchView.as_view(), name='analyze_match'),
]
