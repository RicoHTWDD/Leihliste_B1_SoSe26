from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Item
from .serializers import ItemSerializer, LoanRequestSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by("id")
    serializer_class = ItemSerializer

    @action(detail=True, methods=["post"], url_path="request-loan")
    def request_loan(self, request, pk=None):
        item = self.get_object()

        request_serializer = LoanRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        loan_data = request_serializer.validated_data

        if loan_data["item_id"] != item.id:
            return Response(
                {
                    "item_id": (
                        "Die Gegenstands-ID im JSON-Payload "
                        "stimmt nicht mit der ID in der URL überein."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if item.status != "available":
            return Response(
                {"detail": "Item is not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.status = "requested"
        item.save()

        return Response(
            {
                "item": self.get_serializer(item).data,
                "loan_request": {
                    "item_id": loan_data["item_id"],
                    "start_date": loan_data["start_date"].isoformat(),
                    "end_date": loan_data["end_date"].isoformat(),
                },
            },
            status=status.HTTP_200_OK,
        )