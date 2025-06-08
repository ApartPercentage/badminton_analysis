# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .utils import MatchDataProcessor
import json
from io import StringIO
import traceback
import logging
from rest_framework.parsers import MultiPartParser, FormParser

logger = logging.getLogger(__name__)

class UploadFileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            logger.info("Received file upload request")
            
            if 'file' not in request.FILES:
                logger.error("No file in request.FILES")
                return Response(
                    {'error': 'No file uploaded'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = request.FILES['file']
            logger.info(f"Processing file: {file.name}")

            try:
                # Read the file content
                content = file.read()
                if isinstance(content, bytes):
                    content = content.decode('utf-8')

                # Create a StringIO object
                file_obj = StringIO(content)
                
                # Initialize processor
                processor = MatchDataProcessor(file_obj)
                teams = processor._extract_teams()
                
                # Store in session
                request.session['uploaded_file_data'] = content
                request.session['teams'] = teams

                logger.info(f"Successfully processed file, found teams: {teams}")
                
                return Response({
                    'teams': teams,
                    'message': 'File uploaded successfully'
                })
                
            except Exception as e:
                logger.error(f"Error processing file: {str(e)}")
                logger.error(traceback.format_exc())
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AnalyzeMatchView(APIView):
    def post(self, request):
        try:
            # Debug logging
            logger.debug(f"Received data: {request.data}")
            
            if 'set_scores' not in request.data:
                return Response(
                    {'error': 'No scores provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if 'file_data' not in request.data:
                return Response(
                    {'error': 'No file data provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # Convert file data to file-like object
                file_data = request.data['file_data']
                file = StringIO(file_data)
                
                # Debug the scores format
                scores = request.data['set_scores']
                logger.debug(f"Scores received: {scores}")
                
                # Create processor and process data
                processor = MatchDataProcessor(file)
                
                # Debug the extracted teams
                logger.debug(f"Extracted teams: {processor.teams}")
                
                # Process the match data
                analysis_result = processor.process_match_data(scores)
                
                return Response(analysis_result)
                
            except Exception as e:
                logger.error(f"Error processing data: {str(e)}")
                logger.error(traceback.format_exc())
                return Response(
                    {'error': f'Error processing data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )