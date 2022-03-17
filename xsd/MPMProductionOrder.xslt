<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">

	<!-- Template start  -->
	<xsl:template match="/">

		<!-- Iterating Production Order Header  -->
		<xsl:for-each select="LOIPRO01/IDOC/E1AFKOL">

			<!-- variables for storing plant and order number  -->
			<xsl:variable name="clientNumber">
				<xsl:value-of select="/LOIPRO01/IDOC/EDI_DC40/MANDT" />
			</xsl:variable>
			<xsl:variable name="plantName">
				<xsl:value-of select="WERKS" />
			</xsl:variable>
			<xsl:variable name="productionOrderNumber">
				<xsl:value-of select="AUFNR" />
			</xsl:variable>
			<xsl:variable name="prefix">
				<xsl:value-of
					select="substring('000000000000',1,12 - string-length($productionOrderNumber))" />
			</xsl:variable>
			<xsl:variable name="modifiedProductionOrderNumber">
				<xsl:value-of select="concat($prefix,$productionOrderNumber)" />
			</xsl:variable>

			<!-- Production Order header start  -->

			<productionOrderHeader>

				<!-- Production Order Header Keys start  -->
				<id>
					<client>
						<xsl:value-of select="$clientNumber" />
					</client>
					<plant>
						<xsl:value-of select="$plantName" />
					</plant>
					<orderNumber>
						<xsl:value-of select="$modifiedProductionOrderNumber" />
					</orderNumber>
				</id>
				<!-- Production Order Header Keys end  -->

				<!-- Production Order Header NonKeys start  -->
				<vacancyAssignmentPriority>
					<xsl:value-of select="APRIO" />
				</vacancyAssignmentPriority>
				<scrapPercentage>
					<xsl:value-of select="APROZ" />
				</scrapPercentage>
				<orderType>
					<xsl:value-of select="AUART" />
				</orderType>
				<bomExplosionDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="AUFLD" />
					</xsl:call-template>
				</bomExplosionDate>
				<orderCategory>
					<xsl:value-of select="AUTYP" />
				</orderCategory>
				<baseQuantityForBOM>
					<xsl:value-of select="BAUMNG" />
				</baseQuantityForBOM>
				<baseUOMForBOM>
					<xsl:value-of select="BMEINS" />
				</baseUOMForBOM>
				<baseQuantity>
					<xsl:value-of select="BMENGE" />
				</baseQuantity>
				<orderSequenceNumber>
					<xsl:value-of select="CY_SEQNR" />
				</orderSequenceNumber>
				<orderMRPController>
					<xsl:value-of select="DISPO" />
				</orderMRPController>
				<productionScheduler>
					<xsl:value-of select="FEVOR" />
				</productionScheduler>
				<schedulingMarginKey>
					<xsl:value-of select="FHORI" />
				</schedulingMarginKey>
				<multipleItemsOrder>
					<xsl:value-of select="FLG_MLTPS" />
				</multipleItemsOrder>
				<releasePeriod>
					<xsl:value-of select="FREIZ" />
				</releasePeriod>
				<actualReleaseDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="FTRMI" />
					</xsl:call-template>
				</actualReleaseDate>
				<scheduledReleaseDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="FTRMS" />
					</xsl:call-template>
				</scheduledReleaseDate>
				<totalOrderQuantity>
					<xsl:value-of select="GAMNG" />
				</totalOrderQuantity>
				<totalOrderScrapQuantity>
					<xsl:value-of select="GASMG" />
				</totalOrderScrapQuantity>
				<confirmedOrderFinishDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GETRI" />
					</xsl:call-template>
				</confirmedOrderFinishDate>
				<confirmedOrderFinishTime>
					<xsl:call-template name="formattime">
						<xsl:with-param name="timestr" select="GEUZI" />
					</xsl:call-template>
				</confirmedOrderFinishTime>
				<actualFinishDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GLTRI" />
					</xsl:call-template>
				</actualFinishDate>
				<basicFinishdate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GLTRP" />
					</xsl:call-template>
				</basicFinishdate>
				<scheduledFinishDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GLTRS" />
					</xsl:call-template>
				</scheduledFinishDate>
				<basicFinishTime>
					<xsl:call-template name="formattime">
						<xsl:with-param name="timestr" select="GLUZP" />
					</xsl:call-template>
				</basicFinishTime>
				<scheduledFinishTime>
					<xsl:call-template name="formattime">
						<xsl:with-param name="timestr" select="GLUZS" />
					</xsl:call-template>
				</scheduledFinishTime>
				<commonUOM>
					<xsl:value-of select="GMEIN" />
				</commonUOM>
				<actualStartDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GSTRI" />
					</xsl:call-template>
				</actualStartDate>
				<basicStartDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GSTRP" />
					</xsl:call-template>
				</basicStartDate>
				<scheduledStartDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="GSTRS" />
					</xsl:call-template>
				</scheduledStartDate>
				<basicStartTime>
					<xsl:call-template name="formattime">
						<xsl:with-param name="timestr" select="GSUZP" />
					</xsl:call-template>
				</basicStartTime>
				<scheduledStartTime>
					<xsl:call-template name="formattime">
						<xsl:with-param name="timestr" select="GSUZS" />
					</xsl:call-template>
				</scheduledStartTime>
				<confirmedScrap>
					<xsl:value-of select="IASMG" />
				</confirmedScrap>
				<confirmedYield>
					<xsl:value-of select="IGMNG" />
				</confirmedYield>
				<lotSizeDivisor>
					<xsl:value-of select="LODIV" />
				</lotSizeDivisor>
				<materialNumber>
					<!--<xsl:value-of select="MATNR" /> -->
					<xsl:choose>
	       				<xsl:when test="MATNR_LONG!=''">
							<xsl:call-template name="remove-leading-zeros">
								<xsl:with-param name="text" select="MATNR_LONG"/>
							</xsl:call-template>
	       				</xsl:when>
	       				<xsl:otherwise>
							<xsl:call-template name="remove-leading-zeros">
								<xsl:with-param name="text" select="MATNR"/>
							</xsl:call-template>
	       		 		</xsl:otherwise>
	       			</xsl:choose>
				</materialNumber>
				<routingTransferDate>
					<xsl:call-template name="formatdate">
						<xsl:with-param name="datestr" select="PLAUF" />
					</xsl:call-template>
				</routingTransferDate>
				<responsiblePlannerGroup>
					<xsl:value-of select="PLGRP" />
				</responsiblePlannerGroup>
				<groupCounter>
					<xsl:value-of select="PLNAL" />
				</groupCounter>
				<taskListUOM>
					<xsl:value-of select="PLNME" />
				</taskListUOM>
				<taskListGroupKey>
					<xsl:value-of select="PLNNR" />
				</taskListGroupKey>
				<taskListType>
					<xsl:value-of select="PLNTY" />
				</taskListType>
				<toLotSizeForTaskList>
					<xsl:value-of select="PLSVB" />
				</toLotSizeForTaskList>
				<fromLotSizeForTaskList>
					<xsl:value-of select="PLSVN" />
				</fromLotSizeForTaskList>
				<wbsElement>
					<xsl:value-of select="PSPEL" />
				</wbsElement>
				<schedulingReductionIndicator>
					<xsl:value-of select="REDKZ" />
				</schedulingReductionIndicator>
				<backFlushIndicator>
					<xsl:value-of select="RGEKZ" />
				</backFlushIndicator>
				<totalConfirmedReworkQuantity>
					<xsl:value-of select="RMNGA" />
				</totalConfirmedReworkQuantity>
				<baseUOMForMaterial>
					<xsl:value-of select="SBMEH" />
				</baseUOMForMaterial>
				<baseQuantityForMaterial>
					<xsl:value-of select="SBMNG" />
				</baseQuantityForMaterial>
				<floatAfterProduction>
					<xsl:value-of select="SICHZ" />
				</floatAfterProduction>
				<toLotSizeForBOM>
					<xsl:value-of select="SLSBS" />
				</toLotSizeForBOM>
				<fromLotSizeForBOM>
					<xsl:value-of select="SLSVN" />
				</fromLotSizeForBOM>
				<alternateBOM>
					<xsl:value-of select="STLAL" />
				</alternateBOM>
				<bomUsage>
					<xsl:value-of select="STLAN" />
				</bomUsage>
				<billOfMaterial>
					<xsl:value-of select="STLNR" />
				</billOfMaterial>
				<schedulingType>
					<xsl:value-of select="TERKZ" />
				</schedulingType>
				<floatBeforeProduction>
					<xsl:value-of select="VORGZ" />
				</floatBeforeProduction>
				<externalMaterialNumber>
					<xsl:value-of select="MATNR_EXTERNAL" />
				</externalMaterialNumber>
				<materialNumberVersionNumber>
					<xsl:value-of select="MATNR_VERSION" />
				</materialNumberVersionNumber>
				<materialNumberExternalGUID>
					<xsl:value-of select="MATNR_GUID" />
				</materialNumberExternalGUID>
				<releasedQuantity>0</releasedQuantity>

				<!-- Production Order Header NonKeys end  -->

				<!-- Production Order Header Status starts  -->
				<xsl:for-each select="E1JSTKL">
					<xsl:if test="STAT = 'I0001'">
						<status>CREATED</status>
					</xsl:if>
					<xsl:if test="STAT = 'I0002'">
						<status>RELEASED</status>
					</xsl:if>
					<!-- Production Order Header Status start  -->
					<productionOrderHeaderStatus>

						<!-- Production Order Header Status Keys start  -->
						<id>
							<client>
								<xsl:value-of select="$clientNumber" />
							</client>
							<plant>
								<xsl:value-of select="$plantName" />
							</plant>
							<orderNumber>
								<xsl:value-of select="$modifiedProductionOrderNumber" />
							</orderNumber>
							<objectNumber>
								<xsl:value-of select="OBJNR" />
							</objectNumber>

							<objectStatus>
								<xsl:value-of select="STAT" />
							</objectStatus>

						</id>
						<!-- Production Order Header Status Keys end  -->

						<!-- Production Order Header Status NonKeys start  -->
						<statusProfile>
							<xsl:value-of select="STSMA" />
						</statusProfile>

						<!-- Production Order Header Status NonKeys end  -->

					</productionOrderHeaderStatus>
					<!-- Production Order Header Status end  -->

				</xsl:for-each>
				<!-- Production Order Header Status ends  -->






				<!-- Production Order productionOrderSequences starts -->
				<xsl:for-each select="E1AFFLL">

					<!-- Production Order productionOrderSequences  start  -->
					<productionOrderSequences>

						<!-- Production Order productionOrderSequences Keys start  -->
						<id>
							<client>
								<xsl:value-of select="$clientNumber" />
							</client>
							<plant>
								<xsl:value-of select="$plantName" />
							</plant>
							<orderNumber>
								<xsl:value-of select="$modifiedProductionOrderNumber" />
							</orderNumber>
							<internalCounter>00000001</internalCounter>
						</id>
						<!-- Production Order productionOrderSequences Keys end  -->

						<!-- Production Order productionOrderSequences NonKeys start  -->
						<schedulingAlignmentKey>
							<xsl:value-of select="AUSCHL" />
						</schedulingAlignmentKey>
						<sequenceCategory>
							<xsl:value-of select="FLGAT" />
						</sequenceCategory>
						<operationShortText>
							<xsl:value-of select="LTXA1" />
						</operationShortText>
						<sequence>
							<xsl:value-of select="PLNFL" />
						</sequence>
						<operationNumber1>
							<xsl:value-of select="VORNR1" />
						</operationNumber1>
						<operationNumber2>
							<xsl:value-of select="VORNR2" />
						</operationNumber2>

						<!-- Production Order productionOrderSequences NonKeys end  -->

						<!-- Production Order Processes starts  -->
						<xsl:for-each select="E1AFVOL">
							<xsl:choose>
								<xsl:when  test="(E1JSTVL[position() = 1]/STAT = 'I0013')
									or (E1JSTVL[position() = 2]/STAT = 'I0013')
									or (E1JSTVL[position() = 3]/STAT = 'I0013')
									or (E1JSTVL[position() = 4]/STAT = 'I0013')
									or (E1JSTVL[position() = 5]/STAT = 'I0013')
									or (E1JSTVL[position() = 6]/STAT = 'I0013')
									or (E1JSTVL[position() = 7]/STAT = 'I0013')
									or (E1JSTVL[position() = 8]/STAT = 'I0013')
									or (E1JSTVL[position() = 9]/STAT = 'I0013')
									or (E1JSTVL[position() = 10]/STAT = 'I0013')
									or (E1JSTVL[position() = 11]/STAT = 'I0013')
									or (E1JSTVL[position() = 12]/STAT = 'I0013')
									or (E1JSTVL[position() = 13]/STAT = 'I0013')
									or (E1JSTVL[position() = 14]/STAT = 'I0013')
									or (E1JSTVL[position() = 15]/STAT = 'I0013')">
								</xsl:when>
								<xsl:otherwise>
										<!-- Production Order Processes start  -->
							<productionOrderProcesses>

								<!-- Production Order Processes Keys start  -->
								<id>
									<client>
										<xsl:value-of select="$clientNumber" />
									</client>
									<plant>
										<xsl:value-of select="$plantName" />
									</plant>
									<orderNumber>
										<xsl:value-of select="$modifiedProductionOrderNumber" />
									</orderNumber>
									<internalCounter>00000001</internalCounter>
									<operationNumber>
										<xsl:value-of select="VORNR" />
									</operationNumber>
								</id>
								<!-- Production Order Processes Keys end  -->

								<!-- Production Order Processes NonKeys start  -->
								<superOrdinateOperation>
									<xsl:value-of select="PVZNR" />
								</superOrdinateOperation>
								<simultaneousIndicator>
									<xsl:value-of select="ABLIPKZ" />
								</simultaneousIndicator>
								<tearDown>
									<xsl:value-of select="ABRUE" />
								</tearDown>
								<capacityRequired>
									<xsl:value-of select="ANZZL" />
								</capacityRequired>
								<unitForWork>
									<xsl:value-of select="ARBEH" />
								</unitForWork>
								<workInvolved>
									<xsl:value-of select="ARBEI" />
								</workInvolved>

								<resourceObjectId>
									<xsl:value-of select="ARBID" />
								</resourceObjectId>

								<teardownUOM>
									<xsl:value-of select="ARUZE" />
								</teardownUOM>

								<scrapFactor>
									<xsl:value-of select="AUFAK" />
								</scrapFactor>

								<processingTime>
									<xsl:value-of select="BEARZ" />
								</processingTime>

								<processingTimeUOM>
									<xsl:value-of select="BEAZE" />
								</processingTimeUOM>

								<baseQuantity>
									<xsl:value-of select="BMSCH" />
								</baseQuantity>

								<operationSequenceNumber>
									<xsl:value-of select="CY_SEQNRV" />
								</operationSequenceNumber>

								<normalDurationPerUnit>
									<xsl:value-of select="DAUNE" />
								</normalDurationPerUnit>

								<activityNormalDuration>
									<xsl:value-of select="DAUNO" />
								</activityNormalDuration>

								<minimumDurationUnit>
									<xsl:value-of select="DAUME" />
								</minimumDurationUnit>

								<minimumActivityDuration>
									<xsl:value-of select="DAUMI" />
								</minimumActivityDuration>

								<cfpIndicator>
									<xsl:value-of select="FLIES" />
								</cfpIndicator>

								<earliestScheduledStartDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSAVD" />
									</xsl:call-template>
								</earliestScheduledStartDate>

								<earliestScheduledStartTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSAVZ" />
									</xsl:call-template>
								</earliestScheduledStartTime>

								<earliestScheduledFinishExecutionDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSEDD" />
									</xsl:call-template>
								</earliestScheduledFinishExecutionDate>

								<earliestScheduledFinishExecutionTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSEDZ" />
									</xsl:call-template>
								</earliestScheduledFinishExecutionTime>

								<earliestScheduledFinishWaitDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSELD" />
									</xsl:call-template>
								</earliestScheduledFinishWaitDate>

								<earliestScheduledFinishWaitTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSELZ" />
									</xsl:call-template>
								</earliestScheduledFinishWaitTime>

								<earliestFinishOperationDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSEVD" />
									</xsl:call-template>
								</earliestFinishOperationDate>

								<earliestFinishOperationTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSEVZ" />
									</xsl:call-template>
								</earliestFinishOperationTime>
								<essTeardownDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSSAD" />
									</xsl:call-template>
								</essTeardownDate>

								<essTeardownTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSSAZ" />
									</xsl:call-template>
								</essTeardownTime>
								<essProcessingDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSSBD" />
									</xsl:call-template>
								</essProcessingDate>
								<essProcessingTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSSBZ" />
									</xsl:call-template>
								</essProcessingTime>
								<essWaitDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="FSSLD" />
									</xsl:call-template>
								</essWaitDate>
								<essWaitTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="FSSLZ" />
									</xsl:call-template>
								</essWaitTime>
								<factoryCalendar>
									<xsl:value-of select="KALID" />
								</factoryCalendar>

								<activityType1>
									<xsl:value-of select="LAR01" />
								</activityType1>

								<activityType2>
									<xsl:value-of select="LAR02" />
								</activityType2>

								<activityType3>
									<xsl:value-of select="LAR03" />
								</activityType3>

								<activityType4>
									<xsl:value-of select="LAR04" />
								</activityType4>

								<activityType5>
									<xsl:value-of select="LAR05" />
								</activityType5>

								<activityType6>
									<xsl:value-of select="LAR06" />
								</activityType6>

								<schedulingWaitTime>
									<xsl:value-of select="LIEGZ" />
								</schedulingWaitTime>

								<waitTimeUOM>
									<xsl:value-of select="LIGZE" />
								</waitTimeUOM>

								<totalYieldConfirmed>
									<xsl:value-of select="LMNGA" />
								</totalYieldConfirmed>

								<operationShortText>
									<xsl:value-of select="LTXA1" />
								</operationShortText>

								<operationUOM>
									<xsl:value-of select="MEINH" />
								</operationUOM>

								<minSendAheadQuantity>
									<xsl:value-of select="MINWE" />
								</minSendAheadQuantity>

								<operationQuantity>
									<xsl:value-of select="MGVRG" />
								</operationQuantity>

								<priceUnit>
									<xsl:value-of select="PEINH" />
								</priceUnit>

								<price>
									<xsl:value-of select="PREIS" />
								</price>

								<workPercentage>
									<xsl:value-of select="PRZNT" />
								</workPercentage>

								<setUpTypeKey>
									<xsl:value-of select="RASCH" />
								</setUpTypeKey>

								<setupGroupCategory>
									<xsl:value-of select="RFGRP" />
								</setupGroupCategory>

								<setUpGroupKey>
									<xsl:value-of select="RFSCH" />
								</setUpGroupKey>

								<totalConfirmedReworkQuantity>
									<xsl:value-of select="RMNGA" />
								</totalConfirmedReworkQuantity>

								<setUpTimeUOM>
									<xsl:value-of select="RSTZE" />
								</setUpTimeUOM>

								<setUpTime>
									<xsl:value-of select="RUEST" />
								</setUpTime>

								<maxNumberOfSplits>
									<xsl:value-of select="SPLIM" />
								</maxNumberOfSplits>

								<requiredSplitting>
									<xsl:value-of select="SPMUS" />
								</requiredSplitting>
								<lssExecutionDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSAVD" />
									</xsl:call-template>
								</lssExecutionDate>
								<lssExecutionTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSAVZ" />
									</xsl:call-template>
								</lssExecutionTime>
								<lsfExecutionDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSEDD" />
									</xsl:call-template>
								</lsfExecutionDate>
								<lsfExecutionTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSEDZ" />
									</xsl:call-template>
								</lsfExecutionTime>
								<lsfWaitTimeDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSELD" />
									</xsl:call-template>
								</lsfWaitTimeDate>
								<lsfWaitTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSELZ" />
									</xsl:call-template>
								</lsfWaitTime>
								<latestOperationFinishDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSEVD" />
									</xsl:call-template>
								</latestOperationFinishDate>
								<latestOperationFinishTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSEVZ" />
									</xsl:call-template>
								</latestOperationFinishTime>

								<lssTeardownDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSSAD" />
									</xsl:call-template>
								</lssTeardownDate>

								<lssTeardownTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSSAZ" />
									</xsl:call-template>
								</lssTeardownTime>

								<lssProcessingDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSSBD" />
									</xsl:call-template>
								</lssProcessingDate>

								<lssProcessingTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSSBZ" />
									</xsl:call-template>
								</lssProcessingTime>

								<lssWaitTimeDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="SSSLD" />
									</xsl:call-template>
								</lssWaitTimeDate>

								<lssWaitTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="SSSLZ" />
									</xsl:call-template>
								</lssWaitTime>

								<controlKey>
									<xsl:value-of select="STEUS" />
								</controlKey>

								<schedulingMoveTime>
									<xsl:value-of select="TRANZ" />
								</schedulingMoveTime>

								<moveTimeUOM>
									<xsl:value-of select="TRAZE" />
								</moveTimeUOM>

								<optionalOverlapping>
									<xsl:value-of select="UEKAN" />
								</optionalOverlapping>

								<requiredOverlapping>
									<xsl:value-of select="UEMUS" />
								</requiredOverlapping>

								<userFieldForQuantity04>
									<xsl:value-of select="USR04" />
								</userFieldForQuantity04>

								<userFieldForQuantity05>
									<xsl:value-of select="USR05" />
								</userFieldForQuantity05>

								<quantityFieldsUnit04>
									<xsl:value-of select="USE04" />
								</quantityFieldsUnit04>

								<quantityFieldsUnit05>
									<xsl:value-of select="USE05" />
								</quantityFieldsUnit05>

								<standardValueUOM01>
									<xsl:value-of select="VGE01" />
								</standardValueUOM01>

								<standardValueUOM02>
									<xsl:value-of select="VGE02" />
								</standardValueUOM02>

								<standardValueUOM03>
									<xsl:value-of select="VGE03" />
								</standardValueUOM03>

								<standardValueUOM04>
									<xsl:value-of select="VGE04" />
								</standardValueUOM04>

								<standardValueUOM05>
									<xsl:value-of select="VGE05" />
								</standardValueUOM05>

								<standardValueUOM06>
									<xsl:value-of select="VGE06" />
								</standardValueUOM06>

								<standardValue01>
									<xsl:value-of select="VGW01" />
								</standardValue01>

								<standardValue02>
									<xsl:value-of select="VGW02" />
								</standardValue02>

								<standardValue03>
									<xsl:value-of select="VGW03" />
								</standardValue03>

								<standardValue04>
									<xsl:value-of select="VGW04" />
								</standardValue04>

								<standardValue05>
									<xsl:value-of select="VGW05" />
								</standardValue05>

								<standardValue06>
									<xsl:value-of select="VGW06" />
								</standardValue06>

								<standardValueKey>
									<xsl:value-of select="VGWTS" />
								</standardValueKey>

								<currencyKey>
									<xsl:value-of select="WAERS" />
								</currencyKey>

								<schedulingQueueTime>
									<xsl:value-of select="WARTZ" />
								</schedulingQueueTime>

								<queTimeUOM>
									<xsl:value-of select="WRTZE" />
								</queTimeUOM>

								<operationIndicator>
									<xsl:value-of select="XDISP" />
								</operationIndicator>

								<totalConfirmedScrapQuantity>
									<xsl:value-of select="XMNGA" />
								</totalConfirmedScrapQuantity>

								<requiredWaitTimeUnit>
									<xsl:value-of select="ZEILP" />
								</requiredWaitTimeUnit>

								<minimumProcessingTimeUnit>
									<xsl:value-of select="ZEIMB" />
								</minimumProcessingTimeUnit>

								<minimumOverlapTimeUnit>
									<xsl:value-of select="ZEIMU" />
								</minimumOverlapTimeUnit>

								<standardMoveTimeUnit>
									<xsl:value-of select="ZEITN" />
								</standardMoveTimeUnit>

								<minimumQueueTimeUnit>
									<xsl:value-of select="ZEIWM" />
								</minimumQueueTimeUnit>

								<standardQueueTimeUnit>
									<xsl:value-of select="ZEIWN" />
								</standardQueueTimeUnit>

								<minWaitTime>
									<xsl:value-of select="ZLPRO" />
								</minWaitTime>

								<minProcessingTime>
									<xsl:value-of select="ZMINB" />
								</minProcessingTime>

								<minOverlapTime>
									<xsl:value-of select="ZMINU" />
								</minOverlapTime>

								<minMoveTime>
									<xsl:value-of select="ZTMIN" />
								</minMoveTime>

								<minQueueTime>
									<xsl:value-of select="ZWMIN" />
								</minQueueTime>

								<standardQueueTime>
									<xsl:value-of select="ZWNOR" />
								</standardQueueTime>

								<actualOperationStartDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="ISAVD" />
									</xsl:call-template>
								</actualOperationStartDate>

								<actualOperationFinishDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="IEAVD" />
									</xsl:call-template>
								</actualOperationFinishDate>

								<actualExecutionStartDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="ISDD" />
									</xsl:call-template>
								</actualExecutionStartDate>

								<actualExecutionStartTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="ISDZ" />
									</xsl:call-template>
								</actualExecutionStartTime>

								<actualExecutionFinishDate>
									<xsl:call-template name="formatdate">
										<xsl:with-param name="datestr" select="IEDD" />
									</xsl:call-template>
								</actualExecutionFinishDate>

								<actualExecutionFinishTime>
									<xsl:call-template name="formattime">
										<xsl:with-param name="timestr" select="IEDZ" />
									</xsl:call-template>
								</actualExecutionFinishTime>

								<numberOfEmployees>
									<xsl:value-of select="ANZMA" />
								</numberOfEmployees>
								
								<!-- To skip the release of operations that are not relevant for OEE, uncomment the 'if' block, 
									and specify the condition for setting a value:'X' in the 'skipRelease' field
								-->
								<!-- <xsl:if test="(some condition)">
									<skipRelease>X</skipRelease>
								</xsl:if> -->
								
								
								<!-- Uncomment and pass map the numberOfCapacities to the number of capacities to be used by an order in case the 
								Customization Line Behavior is set to Multi Capacity Single Line -->
								
								<!--<numberOfCapacities>0</numberOfCapacities>-->
								
								<!-- Production Order Processes NonKeys end  -->

								<!-- Production Order Process Status iteration starts  -->
								<xsl:for-each select="E1JSTVL">

									<!-- Production Order Process Status start  -->
									<productionOrderProcessStatus>

										<!-- Production Order Process Status Keys start  -->
										<id>
											<client>
												<xsl:value-of select="$clientNumber" />
											</client>
											<plant>
												<xsl:value-of select="$plantName" />
											</plant>
											<orderNumber>
												<xsl:value-of select="$modifiedProductionOrderNumber" />
											</orderNumber>
											<internalCounter>00000001</internalCounter>
											<operationNumber>
												<xsl:value-of select="current()/parent::node()/VORNR" />
											</operationNumber>
											<objectNumber>
												<xsl:value-of select="OBJNR" />
											</objectNumber>
											<objectStatus>
												<xsl:value-of select="STAT" />
											</objectStatus>
										</id>
										<!-- Production Order Process Status Keys end  -->

										<!-- Production Order Process Status NonKeys start  -->
										<statusProfile>
											<xsl:value-of select="STSMA" />
										</statusProfile>

										<!-- Production Order Process Status NonKeys end  -->

									</productionOrderProcessStatus>
									<!-- Production Order Process Status end  -->

								</xsl:for-each>
								<!-- Production Order Process Status iteration ends  -->

								<!-- Reservation iteration starts  -->
								<xsl:for-each select="E1RESBL">

									<!--  Skip Phantom Component -->
									<xsl:if test="not(DUMPS) or DUMPS != 'X'">
										<!-- Reservation start  -->
										<reservation>


											<!-- Reservation Keys start  -->
											<id>
												<client>
													<xsl:value-of select="$clientNumber" />
												</client>
												<plant>
													<xsl:value-of select="$plantName" />
												</plant>
												<orderNumber>
													<xsl:value-of select="$modifiedProductionOrderNumber" />
												</orderNumber>
												<internalCounter>00000001</internalCounter>
												<operationNumber>
													<xsl:value-of select="current()/parent::node()/VORNR" />
												</operationNumber>
												<reservationNumber>
													<xsl:value-of select="RSNUM" />
												</reservationNumber>
												<reservationItemNumber>
													<xsl:value-of select="RSPOS" />
												</reservationItemNumber>
												<recordType>
													<xsl:value-of select="RSART" />
												</recordType>
											</id>
											<!-- Reservation Keys end  -->

											<!-- Reservation NonKeys start  -->
											<componentScrap>
												<xsl:value-of select="AUSCH" />
											</componentScrap>
											<operationScrap>
												<xsl:value-of select="AVOAU" />
											</operationScrap>
											<requirementType>
												<xsl:value-of select="BDART" />
											</requirementType>
											<requirementQuantity>
												<xsl:value-of select="BDMNG" />
											</requirementQuantity>
											<requirementDate>
												<xsl:call-template name="formatdate">
													<xsl:with-param name="datestr" select="BDTER" />
												</xsl:call-template>
											</requirementDate>
											<materialProvisionIndicator>
												<xsl:value-of select="BEIKZ" />
											</materialProvisionIndicator>
											<batchNumber>
												<xsl:value-of select="CHARG" />
											</batchNumber>
											<directProcurementIndicator>
												<xsl:value-of select="DBSKZ" />
											</directProcurementIndicator>
											<quantityWithdrawn>
												<xsl:value-of select="ENMNG" />
											</quantityWithdrawn>
											<quantityFixed>
												<xsl:value-of select="FMENG" />
											</quantityFixed>
											<coProductIndicator>
												<xsl:value-of select="KZKUP" />
											</coProductIndicator>
											<storageLocation>
												<xsl:value-of select="LGORT" />
											</storageLocation>
											<materialNumber>
													<!--<xsl:value-of select="MATNR" />-->
												<xsl:choose>
	       		 									<xsl:when test="MATNR_LONG!=''">
														<xsl:call-template name="remove-leading-zeros">
															<xsl:with-param name="text" select="MATNR_LONG"/>
														</xsl:call-template>
	       		 									</xsl:when>
	       		 									<xsl:otherwise>
														<xsl:call-template name="remove-leading-zeros">
															<xsl:with-param name="text" select="MATNR"/>
														</xsl:call-template>
	       		 									</xsl:otherwise>
	       		 								</xsl:choose>
											</materialNumber>
											<baseUOM>
												<xsl:value-of select="MEINS" />
											</baseUOM>
											<netScrapIndicator>
												<xsl:value-of select="NETAU" />
											</netScrapIndicator>
											<latestrequirementsDate>
												<xsl:call-template name="formatdate">
													<xsl:with-param name="datestr" select="SBTER" />
												</xsl:call-template>
											</latestrequirementsDate>
											<bulkMaterialIndicator>
												<xsl:value-of select="SCHGT" />
											</bulkMaterialIndicator>
											<specialStockIndicator>
												<xsl:value-of select="SOBKZ" />
											</specialStockIndicator>
											<subItemsExistIndicator>
												<xsl:value-of select="UPSKZ" />
											</subItemsExistIndicator>
											<mrpDistributionKey>
												<xsl:value-of select="VERTI" />
											</mrpDistributionKey>
											<confirmedQuantityForAvailabilityCheck>
												<xsl:value-of select="VMENG" />
											</confirmedQuantityForAvailabilityCheck>
											<debitCreditIndicator>
												<xsl:value-of select="SHKZG" />
											</debitCreditIndicator>
											<movementType>
												<xsl:value-of select="BWART" />
											</movementType>
											<bomItemNumber>
												<xsl:value-of select="POSNR" />
											</bomItemNumber>
											<extMaterialNumber>
												<xsl:value-of select="MATNR_EXTERNAL" />
											</extMaterialNumber>
											<extMaterialVersion>
												<xsl:value-of select="MATNR_VERSION" />
											</extMaterialVersion>
											<extMaterialGUID>
												<xsl:value-of select="MATNR_GUID" />
											</extMaterialGUID>
											<backflushIndicator />
											<warehouseNumber>
												<xsl:value-of select="LGNUM" />
											</warehouseNumber>
											<productionSuppyArea>
												<xsl:value-of select="PRVBE" />
											</productionSuppyArea>

											<!-- Reservation NonKeys end  -->

										</reservation>
										<!-- Reservation end  -->
									</xsl:if>
								</xsl:for-each>
								<!-- Reservation iteration ends  -->

								<!-- Production Order SubProcesses iteration starts  -->
								<xsl:for-each select="E1AFUVL">

									<!-- Production Order SubProcesses start  -->
									<productionOrderSubprocesses>

										<!-- Production Order SubProcesses Keys start  -->
										<id>
											<client>
												<xsl:value-of select="$clientNumber" />
											</client>
											<plant>
												<xsl:value-of select="$plantName" />
											</plant>
											<orderNumber>
												<xsl:value-of select="$modifiedProductionOrderNumber" />
											</orderNumber>
											<internalCounter>00000001</internalCounter>
											<operationNumber>
												<xsl:value-of select="current()/parent::node()/VORNR" />
											</operationNumber>
											<subOperation>
												<xsl:value-of select="UVORN" />
											</subOperation>
										</id>
										<!-- Production Order SubProcesses Keys end  -->

										<!-- Production Order SubProcesses NonKeys start  -->
										<tearDown>
											<xsl:value-of select="ABRUE" />
										</tearDown>
										<capacityRequired>
											<xsl:value-of select="ANZZL" />
										</capacityRequired>
										<unitForWork>
											<xsl:value-of select="ARBEH" />
										</unitForWork>
										<workInvolved>
											<xsl:value-of select="ARBEI" />
										</workInvolved>

										<resourceObjectId>
											<xsl:value-of select="ARBID" />
										</resourceObjectId>

										<teardownUOM>
											<xsl:value-of select="ARUZE" />
										</teardownUOM>

										<scrapFactor>
											<xsl:value-of select="AUFAK" />
										</scrapFactor>

										<processingTime>
											<xsl:value-of select="BEARZ" />
										</processingTime>

										<processingTimeUOM>
											<xsl:value-of select="BEAZE" />
										</processingTimeUOM>

										<baseQuantity>
											<xsl:value-of select="BMSCH" />
										</baseQuantity>

										<operationSequenceNumber>
											<xsl:value-of select="CY_SEQNRV" />
										</operationSequenceNumber>

										<normalDurationPerUnit>
											<xsl:value-of select="DAUNE" />
										</normalDurationPerUnit>

										<activityNormalDuration>
											<xsl:value-of select="DAUNO" />
										</activityNormalDuration>

										<minimumDurationUnit>
											<xsl:value-of select="DAUME" />
										</minimumDurationUnit>

										<minimumActivityDuration>
											<xsl:value-of select="DAUMI" />
										</minimumActivityDuration>
										<earliestScheduledStartDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSAVD" />
											</xsl:call-template>
										</earliestScheduledStartDate>

										<earliestScheduledStartTime>
											<xsl:value-of select="FSAVZ" />
										</earliestScheduledStartTime>

										<earliestScheduledFinishExecutionDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSEDD" />
											</xsl:call-template>
										</earliestScheduledFinishExecutionDate>

										<earliestScheduledFinishExecutionTime>
											<xsl:value-of select="FSEDZ" />
										</earliestScheduledFinishExecutionTime>

										<earliestScheduledFinishWaitDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSELD" />
											</xsl:call-template>
										</earliestScheduledFinishWaitDate>

										<earliestScheduledFinishWaitTime>
											<xsl:value-of select="FSELZ" />
										</earliestScheduledFinishWaitTime>

										<earliestFinishOperationDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSEVD" />
											</xsl:call-template>
										</earliestFinishOperationDate>

										<earliestFinishOperationTime>
											<xsl:value-of select="FSEVZ" />
										</earliestFinishOperationTime>
										<essTeardownDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSSAD" />
											</xsl:call-template>
										</essTeardownDate>

										<essTeardownTime>
											<xsl:value-of select="FSSAZ" />
										</essTeardownTime>
										<essProcessingDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSSBD" />
											</xsl:call-template>
										</essProcessingDate>
										<essProcessingTime>
											<xsl:value-of select="FSSBZ" />
										</essProcessingTime>
										<essWaitDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSSLD" />
											</xsl:call-template>
										</essWaitDate>
										<essWaitTime>
											<xsl:value-of select="FSSLZ" />
										</essWaitTime>
										<factoryCalendar>
											<xsl:value-of select="KALID" />
										</factoryCalendar>

										<activityType1>
											<xsl:value-of select="LAR01" />
										</activityType1>

										<activityType2>
											<xsl:value-of select="LAR02" />
										</activityType2>

										<activityType3>
											<xsl:value-of select="LAR03" />
										</activityType3>

										<activityType4>
											<xsl:value-of select="LAR04" />
										</activityType4>

										<activityType5>
											<xsl:value-of select="LAR05" />
										</activityType5>

										<activityType6>
											<xsl:value-of select="LAR06" />
										</activityType6>

										<schedulingWaitTime>
											<xsl:value-of select="LIEGZ" />
										</schedulingWaitTime>

										<waitTimeUOM>
											<xsl:value-of select="LIGZE" />
										</waitTimeUOM>

										<totalYieldConfirmed>
											<xsl:value-of select="LMNGA" />
										</totalYieldConfirmed>

										<operationShortText>
											<xsl:value-of select="LTXA1" />
										</operationShortText>

										<operationUOM>
											<xsl:value-of select="MEINH" />
										</operationUOM>

										<minSendAheadQuantity>
											<xsl:value-of select="MINWE" />
										</minSendAheadQuantity>

										<operationQuantity>
											<xsl:value-of select="MGVRG" />
										</operationQuantity>

										<priceUnit>
											<xsl:value-of select="PEINH" />
										</priceUnit>

										<price>
											<xsl:value-of select="PREIS" />
										</price>

										<workPercentage>
											<xsl:value-of select="PRZNT" />
										</workPercentage>

										<setUpTypeKey>
											<xsl:value-of select="RASCH" />
										</setUpTypeKey>

										<setupGroupCategory>
											<xsl:value-of select="RFGRP" />
										</setupGroupCategory>

										<setUpGroupKey>
											<xsl:value-of select="RFSCH" />
										</setUpGroupKey>

										<totalConfirmedReworkQuantity>
											<xsl:value-of select="RMNGA" />
										</totalConfirmedReworkQuantity>

										<setUpTimeUOM>
											<xsl:value-of select="RSTZE" />
										</setUpTimeUOM>

										<setUpTime>
											<xsl:value-of select="RUEST" />
										</setUpTime>

										<maxNumberOfSplits>
											<xsl:value-of select="SPLIM" />
										</maxNumberOfSplits>

										<requiredSplitting>
											<xsl:value-of select="SPMUS" />
										</requiredSplitting>
										<lssExecutionDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSAVD" />
											</xsl:call-template>
										</lssExecutionDate>
										<lssExecutionTime>
											<xsl:value-of select="SSAVZ" />
										</lssExecutionTime>
										<lsfExecutionDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSEDD" />
											</xsl:call-template>
										</lsfExecutionDate>
										<lsfExecutionTime>
											<xsl:value-of select="SSEDZ" />
										</lsfExecutionTime>
										<lsfWaitTimeDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSELD" />
											</xsl:call-template>
										</lsfWaitTimeDate>
										<lsfWaitTime>
											<xsl:value-of select="SSELZ" />
										</lsfWaitTime>
										<latestOperationFinishDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSEVD" />
											</xsl:call-template>
										</latestOperationFinishDate>
										<latestOperationFinishTime>
											<xsl:value-of select="SSEVZ" />
										</latestOperationFinishTime>

										<lssTeardownDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSSAD" />
											</xsl:call-template>
											<xsl:value-of select="SSSAD" />
										</lssTeardownDate>

										<lssTeardownTime>
											<xsl:value-of select="SSSAZ" />
										</lssTeardownTime>

										<lssProcessingDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSSBD" />
											</xsl:call-template>
										</lssProcessingDate>

										<lssProcessingTime>
											<xsl:value-of select="SSSBZ" />
										</lssProcessingTime>

										<lssWaitTimeDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="SSSLD" />
											</xsl:call-template>
										</lssWaitTimeDate>

										<lssWaitTime>
											<xsl:value-of select="SSSLZ" />
										</lssWaitTime>

										<controlKey>
											<xsl:value-of select="STEUS" />
										</controlKey>

										<schedulingMoveTime>
											<xsl:value-of select="TRANZ" />
										</schedulingMoveTime>

										<moveTimeUOM>
											<xsl:value-of select="TRAZE" />
										</moveTimeUOM>

										<optionalOverlapping>
											<xsl:value-of select="UEKAN" />
										</optionalOverlapping>

										<requiredOverlapping>
											<xsl:value-of select="UEMUS" />
										</requiredOverlapping>

										<userFieldForQuantity04>
											<xsl:value-of select="USR04" />
										</userFieldForQuantity04>

										<userFieldForQuantity05>
											<xsl:value-of select="USR05" />
										</userFieldForQuantity05>

										<quantityFieldsUnit04>
											<xsl:value-of select="USE04" />
										</quantityFieldsUnit04>

										<quantityFieldsUnit05>
											<xsl:value-of select="USE05" />
										</quantityFieldsUnit05>

										<standardValueUOM01>
											<xsl:value-of select="VGE01" />
										</standardValueUOM01>

										<standardValueUOM02>
											<xsl:value-of select="VGE02" />
										</standardValueUOM02>

										<standardValueUOM03>
											<xsl:value-of select="VGE03" />
										</standardValueUOM03>

										<standardValueUOM04>
											<xsl:value-of select="VGE04" />
										</standardValueUOM04>

										<standardValueUOM05>
											<xsl:value-of select="VGE05" />
										</standardValueUOM05>

										<standardValueUOM06>
											<xsl:value-of select="VGE06" />
										</standardValueUOM06>

										<standardValue01>
											<xsl:value-of select="VGW01" />
										</standardValue01>

										<standardValue02>
											<xsl:value-of select="VGW02" />
										</standardValue02>

										<standardValue03>
											<xsl:value-of select="VGW03" />
										</standardValue03>

										<standardValue04>
											<xsl:value-of select="VGW04" />
										</standardValue04>

										<standardValue05>
											<xsl:value-of select="VGW05" />
										</standardValue05>

										<standardValue06>
											<xsl:value-of select="VGW06" />
										</standardValue06>

										<standardValueKey>
											<xsl:value-of select="VGWTS" />
										</standardValueKey>

										<currencyKey>
											<xsl:value-of select="WAERS" />
										</currencyKey>

										<schedulingQueueTime>
											<xsl:value-of select="WARTZ" />
										</schedulingQueueTime>

										<queTimeUOM>
											<xsl:value-of select="WRTZE" />
										</queTimeUOM>

										<operationIndicator>
											<xsl:value-of select="XDISP" />
										</operationIndicator>

										<totalConfirmedScrapQuantity>
											<xsl:value-of select="XMNGA" />
										</totalConfirmedScrapQuantity>

										<requiredWaitTimeUnit>
											<xsl:value-of select="ZEILP" />
										</requiredWaitTimeUnit>

										<minimumProcessingTimeUnit>
											<xsl:value-of select="ZEIMB" />
										</minimumProcessingTimeUnit>

										<minimumOverlapTimeUnit>
											<xsl:value-of select="ZEIMU" />
										</minimumOverlapTimeUnit>

										<standardMoveTimeUnit>
											<xsl:value-of select="ZEITN" />
										</standardMoveTimeUnit>

										<minimumQueueTimeUnit>
											<xsl:value-of select="ZEIWM" />
										</minimumQueueTimeUnit>

										<standardQueueTimeUnit>
											<xsl:value-of select="ZEIWN" />
										</standardQueueTimeUnit>

										<minWaitTime>
											<xsl:value-of select="ZLPRO" />
										</minWaitTime>

										<minProcessingTime>
											<xsl:value-of select="ZMINB" />
										</minProcessingTime>

										<minOverlapTime>
											<xsl:value-of select="ZMINU" />
										</minOverlapTime>

										<minMoveTime>
											<xsl:value-of select="ZTMIN" />
										</minMoveTime>

										<minQueueTime>
											<xsl:value-of select="ZWMIN" />
										</minQueueTime>

										<standardQueueTime>
											<xsl:value-of select="ZWNOR" />
										</standardQueueTime>

										<actualOperationStartDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="ISAVD" />
											</xsl:call-template>
										</actualOperationStartDate>

										<actualOperationFinishDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="IEAVD" />
											</xsl:call-template>
										</actualOperationFinishDate>

										<actualExecutionStartDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="ISDD" />
											</xsl:call-template>
										</actualExecutionStartDate>

										<actualExecutionStartTime>
											<xsl:value-of select="ISDZ" />
										</actualExecutionStartTime>

										<actualExecutionFinishDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="IEDD" />
											</xsl:call-template>
										</actualExecutionFinishDate>

										<actualExecutionFinishTime>
											<xsl:value-of select="IEDZ" />
										</actualExecutionFinishTime>

										<numberOfEmployees>
											<xsl:value-of select="ANZMA" />
										</numberOfEmployees>
										<!-- Production Order SubProcesses NonKeys end  -->


										<!-- Production Order Subprocesses Status starts  -->
										<xsl:for-each select="E1JSTUL">

											<!-- Production Order Subprocesses Status start  -->
											<productionOrderSubprocessesStatus>

												<!-- Production Order Subprocesses Status Keys start  -->
												<id>
													<client>
														<xsl:value-of select="$clientNumber" />
													</client>
													<plant>
														<xsl:value-of select="$plantName" />
													</plant>
													<orderNumber>
														<xsl:value-of select="$modifiedProductionOrderNumber" />
													</orderNumber>
													<internalCounter>00000001</internalCounter>
													<operationNumber>
														<xsl:value-of
															select="current()/parent::node()/parent::node()/VORNR" />
													</operationNumber>
													<subOperation>
														<xsl:value-of select="current()/parent::node()/UVORN" />
													</subOperation>
													<objectNumber>
														<xsl:value-of select="OBJNR" />
													</objectNumber>
													<objectStatus>
														<xsl:value-of select="STAT" />
													</objectStatus>
												</id>
												<!-- Production Order Subprocesses Status Keys end  -->

												<!-- Production Order Subprocesses Status NonKeys start  -->
												<statusProfile>
													<xsl:value-of select="STSMA" />
												</statusProfile>

												<!-- Production Order Subprocesses Status NonKeys end  -->

											</productionOrderSubprocessesStatus>
											<!-- Production Order Subprocesses Status end  -->

										</xsl:for-each>
										<!-- Production Order Subprocesses Status iteration ends  -->


										<!-- SubProcesses Capacity Requirements Records iteration starts  -->
										<xsl:for-each select="E1KBEUL">

											<!-- Subprocesses Capacity Requirements Records start  -->
											<subprocessesCapacityRequirementsRecords>

												<!-- Subprocesses Capacity Requirements Records Keys start  -->
												<id>
													<client>
														<xsl:value-of select="$clientNumber" />
													</client>
													<plant>
														<xsl:value-of select="$plantName" />
													</plant>
													<orderNumber>
														<xsl:value-of select="$modifiedProductionOrderNumber" />
													</orderNumber>
													<internalCounter>00000001</internalCounter>
													<operationNumber>
														<xsl:value-of
															select="current()/parent::node()/parent::node()/VORNR" />
													</operationNumber>
													<subOperation>
														<xsl:value-of select="current()/parent::node()/UVORN" />
													</subOperation>
													<capacityRequirementsRecordId>
														<xsl:value-of select="BEDID" />
													</capacityRequirementsRecordId>
													<internalCapacityCounter>
														<xsl:value-of select="BEDZL" />
													</internalCapacityCounter>
													<counter>
														<xsl:value-of select="CANUM" />
													</counter>
												</id>
												<!-- Subprocesses Capacity Requirements Records Keys end  -->

												<!-- Subprocesses Capacity Requirements Records NonKeys start  -->
												<remainingSplitRecordIndicator>
													<xsl:value-of select="BEDKZ" />
												</remainingSplitRecordIndicator>
												<tearDownRemainingCapacityRequirement>
													<xsl:value-of select="KABRREST" />
												</tearDownRemainingCapacityRequirement>
												<tearDownScheduledCapacityRequirement>
													<xsl:value-of select="KABRSOLL" />
												</tearDownScheduledCapacityRequirement>
												<capacityCategory>
													<xsl:value-of select="KAPAR" />
												</capacityCategory>
												<capacityId>
													<xsl:value-of select="KAPID" />
												</capacityId>
												<processingRemainingCapacityRequirement>
													<xsl:value-of select="KBEAREST" />
												</processingRemainingCapacityRequirement>
												<processingScheduledCapacityRequirement>
													<xsl:value-of select="KBEASOLL" />
												</processingScheduledCapacityRequirement>
												<capacityRequirementsUOM>
													<xsl:value-of select="KEINH" />
												</capacityRequirementsUOM>
												<setupRemainingCapacityRequirement>
													<xsl:value-of select="KRUEREST" />
												</setupRemainingCapacityRequirement>
												<setupScheduledCapacityRequirement>
													<xsl:value-of select="KRUESOLL" />
												</setupScheduledCapacityRequirement>

												<!-- Subprocesses Capacity Requirements Records NonKeys end  -->

											</subprocessesCapacityRequirementsRecords>
											<!-- Subprocesses Capacity Requirements Records end  -->

										</xsl:for-each>
										<!-- Subprocesses Capacity Requirements Records iteration ends  -->

									</productionOrderSubprocesses>
									<!-- Production Order SubProcesses end  -->

								</xsl:for-each>
								<!-- Production Order SubProcesses iteration ends  -->

								<!-- Processes Capacity Requirements Records iteration starts  -->
								<xsl:for-each select="E1KBEDL">

									<!-- processes Capacity Requirements Records start  -->
									<processesCapacityRequirementsRecords>

										<!-- processes Capacity Requirements Records Keys start  -->
										<id>
											<client>
												<xsl:value-of select="$clientNumber" />
											</client>
											<plant>
												<xsl:value-of select="$plantName" />
											</plant>
											<orderNumber>
												<xsl:value-of select="$modifiedProductionOrderNumber" />
											</orderNumber>
											<internalCounter>00000001</internalCounter>
											<operationNumber>
												<xsl:value-of select="current()/parent::node()/VORNR" />
											</operationNumber>
											<capacityRequirementsRecordId>
												<xsl:value-of select="BEDID" />
											</capacityRequirementsRecordId>
											<internalCapacityCounter>
												<xsl:value-of select="BEDZL" />
											</internalCapacityCounter>
											<counter>
												<xsl:value-of select="CANUM" />
											</counter>
										</id>
										<!-- processes Capacity Requirements Records Keys end  -->

										<!-- processes Capacity Requirements Records NonKeys start  -->
										<remainingSplitRecordIndicator>
											<xsl:value-of select="BEDKZ" />
										</remainingSplitRecordIndicator>
										<tearDownRemainingCapacityRequirement>
											<xsl:value-of select="KABRREST" />
										</tearDownRemainingCapacityRequirement>
										<tearDownScheduledCapacityRequirement>
											<xsl:value-of select="KABRSOLL" />
										</tearDownScheduledCapacityRequirement>
										<capacityCategory>
											<xsl:value-of select="KAPAR" />
										</capacityCategory>
										<capacityId>
											<xsl:value-of select="KAPID" />
										</capacityId>
										<processingRemainingCapacityRequirement>
											<xsl:value-of select="KBEAREST" />
										</processingRemainingCapacityRequirement>
										<processingScheduledCapacityRequirement>
											<xsl:value-of select="KBEASOLL" />
										</processingScheduledCapacityRequirement>
										<capacityRequirementsUOM>
											<xsl:value-of select="KEINH" />
										</capacityRequirementsUOM>
										<setupRemainingCapacityRequirement>
											<xsl:value-of select="KRUEREST" />
										</setupRemainingCapacityRequirement>
										<setupScheduledCapacityRequirement>
											<xsl:value-of select="KRUESOLL" />
										</setupScheduledCapacityRequirement>
										<workcenterID>
											<xsl:value-of select="ARBID" />
										</workcenterID>
										<earliestStartDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FSTAD" />
											</xsl:call-template>
										</earliestStartDate>
										<earliestStartTime>
											<xsl:call-template name="formattime">
												<xsl:with-param name="timestr" select="FSTAU" />
											</xsl:call-template>										
										</earliestStartTime>
										<earliestFinishDate>
											<xsl:call-template name="formatdate">
												<xsl:with-param name="datestr" select="FENDD" />
											</xsl:call-template>
										</earliestFinishDate>
										<earliestFinishTime>
										<xsl:call-template name="formattime">
												<xsl:with-param name="timestr" select="FENDU" />
											</xsl:call-template>	
										</earliestFinishTime>
										<splitNumber>
											<xsl:value-of select="SPLIT" />
										</splitNumber>
										<operationQuantity>
											<xsl:value-of select="MGVRG" />
										</operationQuantity>
										<operationUOM>
											<xsl:value-of select="MEINH" />
										</operationUOM>

										<!-- processes Capacity Requirements Records NonKeys end  -->

									</processesCapacityRequirementsRecords>
									<!-- processes Capacity Requirements Records end  -->

								</xsl:for-each>
								<!-- processes Capacity Requirements Records iteration ends  -->

								</productionOrderProcesses>
								<!-- Production Order Processes end  -->

								</xsl:otherwise>
							</xsl:choose>
							
						</xsl:for-each>
						<!-- Production Order Processes iteration ends  -->

					</productionOrderSequences>
					<!-- Production Order productionOrderSequences end  -->

				</xsl:for-each>
				<!-- Production Order productionOrderSequences iteration ends  -->


				<!-- Production Order Items Iteration starts  -->
				<xsl:for-each select="E1AFPOL">

					<!-- Production Order Items start  -->
					<productionOrderItems>

						<!-- Production Order Items Keys start  -->
						<id>
							<client>
								<xsl:value-of select="$clientNumber" />
							</client>
							<plant>
								<xsl:value-of select="$plantName" />
							</plant>
							<orderNumber>
								<xsl:value-of select="$modifiedProductionOrderNumber" />
							</orderNumber>
							<orderItemNumber>
								<xsl:value-of select="POSNR" />
							</orderItemNumber>

						</id>
						<!-- Production Order Items Keys end  -->

						<!-- Production Order Items NonKeys start  -->
						<inhouseProductionUOM>
							<xsl:value-of select="AMEIN" />
						</inhouseProductionUOM>
						<confirmedQuantity>
							<xsl:value-of select="BMENG" />
						</confirmedQuantity>
						<orderReleasedIndicator>
							<xsl:value-of select="DFREI" />
						</orderReleasedIndicator>
						<salesOrderNumber>
							<xsl:value-of select="KDAUF" />
						</salesOrderNumber>
						<salesOrderDeliverySchedule>
							<xsl:value-of select="KDEIN" />
						</salesOrderDeliverySchedule>
						<salesOrderItemNumber>
							<xsl:value-of select="KDPOS" />
						</salesOrderItemNumber>
						<storageLocation>
							<xsl:value-of select="LGORT" />
						</storageLocation>
						<materialNumber>
							<!--<xsl:value-of select="MATNR" /> -->
							<xsl:choose>
	       		 				<xsl:when test="MATNR_LONG!=''">
									<xsl:call-template name="remove-leading-zeros">
										<xsl:with-param name="text" select="MATNR_LONG"/>
									</xsl:call-template>
	       		 				</xsl:when>
	       		 				<xsl:otherwise>
									<xsl:call-template name="remove-leading-zeros">
										<xsl:with-param name="text" select="MATNR"/>
									</xsl:call-template>
	       		 				</xsl:otherwise>
	       		 			</xsl:choose>	
						</materialNumber>
						<baseUOM>
							<xsl:value-of select="MEINS" />
						</baseUOM>
						<plannedOrderNumber>
							<xsl:value-of select="PLNUM" />
						</plannedOrderNumber>
						<scrapQuantity>
							<xsl:value-of select="PSAMG" />
						</scrapQuantity>
						<orderItemQuantity>
							<xsl:value-of select="PSMNG" />
						</orderItemQuantity>
						<runScheduleHeaderNumber>
							<xsl:value-of select="SAFNR" />
						</runScheduleHeaderNumber>
						<bomExplosionNumber>
							<xsl:value-of select="SERNR" />
						</bomExplosionNumber>
						<baseUOMConversionDenominator>
							<xsl:value-of select="UMREN" />
						</baseUOMConversionDenominator>
						<baseUOMConversionNumerator>
							<xsl:value-of select="UMREZ" />
						</baseUOMConversionNumerator>
						<productionVersion>
							<xsl:value-of select="VERID" />
						</productionVersion>
						<goodsRecieptProcessingTime>
							<xsl:value-of select="WEBAZ" />
						</goodsRecieptProcessingTime>
						<orderItemGoodsQuantity>
							<xsl:value-of select="WEMNG" />
						</orderItemGoodsQuantity>
						<externalMaterialNumber>
							<xsl:value-of select="MATNR_EXTERNAL" />
						</externalMaterialNumber>
						<externalMaterialVersion>
							<xsl:value-of select="MATNR_VERSION" />
						</externalMaterialVersion>
						<externalMaterialGUID>
							<xsl:value-of select="MATNR_GUID" />
						</externalMaterialGUID>
						<batchNumber>
							<xsl:value-of select="CHARG" />
						</batchNumber>
						<warehouseNumber>
							<xsl:value-of select="LGNUM" />
						</warehouseNumber>
						<!-- Production Order Items NonKeys end  -->

					</productionOrderItems>
					<!-- Production Order Items end  -->

				</xsl:for-each>
				<!-- Production Order Items Iteration starts  -->

			</productionOrderHeader>
			<!-- Production Order Header end  -->

		</xsl:for-each>
	</xsl:template>
	<!-- Template end  -->

	<xsl:template name="formatdate">
		<xsl:param name="datestr" />
		<!-- input format yyyymmdd -->
		<!-- output format yyyy-mm-dd -->
		<xsl:variable name="abc">
			<xsl:if test="$datestr = '00000000'">
				<xsl:value-of select="19000101" />
			</xsl:if>
			<xsl:if test="$datestr != '00000000'">
				<xsl:value-of select="$datestr" />
			</xsl:if>
		</xsl:variable>
		<xsl:variable name="yyyy">
			<xsl:value-of select="substring($abc,1,4)" />
		</xsl:variable>
		<xsl:variable name="mm">
			<xsl:value-of select="substring($abc,5,2)" />
		</xsl:variable>
		<xsl:variable name="dd">
			<xsl:value-of select="substring($abc,7,2)" />
		</xsl:variable>
		<xsl:value-of select="$yyyy" />
		<xsl:value-of select="'-'" />
		<xsl:value-of select="$mm" />
		<xsl:value-of select="'-'" />
		<xsl:value-of select="$dd" />
	</xsl:template>
	<xsl:template name="formattime">
		<xsl:param name="timestr" />
		<!-- input format hhmmss -->
		<!-- output format hh:mm:ss -->
		<xsl:variable name="xyz">
				<xsl:value-of select="$timestr" />
		</xsl:variable>
		<xsl:variable name="hh">
			<xsl:value-of select="substring($xyz,1,2)" />
		</xsl:variable>
		<xsl:variable name="mm">
			<xsl:value-of select="substring($xyz,3,2)" />
		</xsl:variable>
		<xsl:variable name="ss">
			<xsl:value-of select="substring($xyz,5,2)" />
		</xsl:variable>
		<xsl:value-of select="$hh" />
		<xsl:value-of select="':'" />
		<xsl:value-of select="$mm" />
		<xsl:value-of select="':'" />
		<xsl:value-of select="$ss" />
	</xsl:template>	
	<xsl:template name="remove-leading-zeros">
	    <xsl:param name="text"/>
	    <xsl:choose>
	        <xsl:when test="starts-with($text,'0')">
	            <xsl:call-template name="remove-leading-zeros">
	                <xsl:with-param name="text"
	                    select="substring-after($text,'0')"/>
	            </xsl:call-template>
	        </xsl:when>
	        <xsl:otherwise>
	            <xsl:value-of select="$text"/>
	        </xsl:otherwise>
	    </xsl:choose>
	</xsl:template>
</xsl:stylesheet>
